import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request-promise-native';
import * as url from 'url';
import {
  IImagesToSubmitResponse,
  ISaveItemRequest,
  ISaveItemsResponse,
  ISubmitItemsRequest,
  ISubmitItemsResponse,
  IUploadResult,
} from './types';

export class ShutterstockClient {
  private static HOST = 'https://submit.shutterstock.com';
  private static USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36';

  private http: typeof request;

  constructor(private session: string, httpDefaultParams?: any) {
    this.http = request.defaults({
      ...httpDefaultParams,
      resolveWithFullResponse: true,
      followRedirect: false,
      headers: {
        'User-Agent': ShutterstockClient.USER_AGENT,
      },
    } as any);
  }

  public async isAuthenticated(): Promise<boolean> {
    try {
      await this.get('upload/portfolio');
      return true;
    } catch (e) {
      return false;
    }
  }

  public async upload(
    file: string,
    fileStream?: fs.ReadStream
  ): Promise<IUploadResult> {
    if (!(await this.isAuthenticated())) {
      throw new Error('not authenticated');
    }

    const { body } = await this.get('upload/portfolio');
    const uploadJwt = (/window\.Ss\.upload_jwt\s*=\s*\"(.*)\"/gi.exec(body) || [
      '',
    ])[1];
    if (!uploadJwt) {
      throw new Error('uploadJwt for uploading was not resolved');
    }

    await this.http({
      method: 'OPTIONS',
      url: 'https://media-upload.shutterstock.com/v1/media/asset',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers':
          'cache-control,x-requested-with,x-shutterstock-upload-jwt',
        'User-Agent': ShutterstockClient.USER_AGENT,
      },
    });

    const uploadResponse = await this.http.post(
      'https://media-upload.shutterstock.com/v1/media/asset',
      {
        formData: {
          name: path.basename(file),
          _session_id: '',
          file: fileStream || fs.createReadStream(file),
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-shutterstock-upload-jwt': uploadJwt,
          Origin: ShutterstockClient.HOST,
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      }
    );
    return JSON.parse(uploadResponse.body);
  }

  public async getImagesToSubmit(page = 1): Promise<IImagesToSubmitResponse> {
    const response = await this.get('api/content_editor/photo', {
      order: 'newest',
      per_page: 40,
      page,
      status: 'edit',
    });
    return JSON.parse(response.body);
  }

  // public async submitAll(fields?: Partial<ISubmitItemRequest>): Promise<ISubmitItemsResponse[]> {
  //     let page = 1;
  //     const responses: ISubmitItemsResponse[] = [];
  //     for (; ;) {
  //         const toSubmit = await this.getImagesToSubmit(page);
  //         if (toSubmit.data.length === 0) {
  //             break;
  //         }
  //         responses.push(await this.submit(toSubmit.data.map(item => ({ ...item, ...fields }))));
  //         page++;
  //     }
  //     return responses;
  // }

  public async save(
    items: Array<Partial<ISaveItemRequest>>
  ): Promise<ISaveItemsResponse> {
    assert(
      items.every(item => !!item.id),
      'id must be set'
    );
    const normalizedIds = items.map(item => ({
      ...item,
      id: 'U' + (item.id || '').replace(/^U/gi, ''),
    }));
    return this.patch('api/content_editor', normalizedIds);
  }

  public async submit(ids: number[]): Promise<ISubmitItemsResponse> {
    const requestBody: ISubmitItemsRequest = {
      media: ids.map(id => ({
        media_id: 'U' + id,
        media_type: 'photo',
      })),
      keywords_not_to_spellcheck: [],
      skip_spellcheck: 'true',
    };

    const submitResponse = await this.post(
      'api/content_editor/submit',
      requestBody
    );
    return JSON.parse(submitResponse.body);
  }

  private async get(urlPath: string, qs?: any) {
    return this.http.get(url.resolve(ShutterstockClient.HOST, urlPath), {
      headers: {
        Cookie: `session=${this.session}`,
      },
      qs,
    });
  }

  private async patch(urlPath: string, body: any) {
    return this.http.patch(url.resolve(ShutterstockClient.HOST, urlPath), {
      headers: {
        Cookie: `session=${this.session}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });
  }

  private async post(urlPath: string, body: any) {
    return this.http.post(url.resolve(ShutterstockClient.HOST, urlPath), {
      headers: {
        Cookie: `session=${this.session}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });
  }
}
