import Flow from '@faasjs/flow';
import { handler } from '../index';

describe('method', function () {
  const flow = new Flow(
    {
      resource: {
        handler: () => -1
      },
      triggers: {
        http: {
          handler,
          method: 'GET',
        },
      },
    },
    function (prev: any) {
      return prev;
    },
  );

  const trigger = flow.createTrigger('http');

  test('correct', async function () {
    const res = await trigger({ method: 'GET' }, {});

    expect(res.statusCode).toEqual(200);
  });

  test('error', async function () {
    const res = await trigger({ method: 'POST' }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"Wrong method"}}');
  });
});
