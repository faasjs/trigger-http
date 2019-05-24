import Flow from '@faasjs/flow';
import { handler } from '../index';

describe('param', function () {
  const flow = new Flow(
    {
      triggers: {
        http: {
          handler,
          param: {
            key: {
              required: true,
            },
          },
        },
      },
    },
    function (prev: any) {
      return prev.param;
    },
  );

  const trigger = flow.createTrigger('http');

  test('correct', async function () {
    const res = await trigger({
      body: '{"key":1}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual('{"data":{"key":1}}');
  });

  test('error', async function () {
    const res = await trigger({}, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key required"}}');
  });
});
