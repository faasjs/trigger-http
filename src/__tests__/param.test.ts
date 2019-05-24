import Flow from '@faasjs/flow';
import { handler } from '../index';

describe('param', function () {
  const flow = new Flow(
    {
      resource: {
        handler: () => -1
      },
      triggers: {
        http: {
          handler,
          param: {
            key: {
              required: true,
              type: 'number'
            },
            key1: {
              type: 'string'
            },
            key2: {
              verified: (a: number) => {
                return a + 1 > 2;
              },
              type: 'number'
            }
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

  test('correct', async function () {
    const res = await trigger({
      body: '{"key":1, "key1": "1", "key2":1}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual('{"data":{"key":1,"key1":"1","key2":1}}');
  });

  test('type error', async function () {
    const res = await trigger({
      body: '{"key":1, "key2": 3}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key2 verification failed"}}');
  });

  test('type error', async function () {
    const res = await trigger({
      body: '{"key":"1"}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key type error"}}');
  });

  test('error', async function () {
    const res = await trigger({}, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key required"}}');
  });
});
