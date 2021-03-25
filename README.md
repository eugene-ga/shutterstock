### For reference and example only, no warranty of any kind.

# Using this module

```
yarn add shutterstock-submit
```

- Session cookie required to use this module. It cannot access shutterstock contributor area using user credentials, beacause shutterstock requires solving captcha.

```ts
import { ShutterstockClient } from 'shutterstock-submit';
const client = new ShutterstockClient(<provide session cookie here>);
```

- To upload file
```ts
const file = await client.upload('path/to/file');
 ```

 - to get all uploaded but not submited images
 ```ts
const imagesToSubmit = await client.getImagesToSubmit();
 ```

- to update images attributes
 ```ts
  await client.save([
    {
      categories: ['11', '1'],
      id: file.upload_id,
    },
  ]);
 ```

 - to submit images
 ```ts
 await client.submit([+file.upload_id]);
 ```

- session id can be taken using chrome dev tools
![compare selected](https://github.com/shvendala/shutterstock/blob/master/docs/dev-tools.png?raw=true)
