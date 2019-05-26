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
              verifiy: {
                required: true,
                type: 'number'
              }
            },
            key1: {
              verifiy: {
                handler: (a: number) => {
                  return a + 1 > 2;
                },
                type: 'number',
                error: 'error_message'
              }
            },
            key2: {
              verifiy: {
                required: true,
                internal: true
              },
              key3: {
                verifiy: {
                  internal: true
                },
                key6: {
                  verifiy: {
                    type: 'number'
                  }
                }
              }
            },
            key4: {
              verifiy: {
                internal: true
              },
              key5: {
                type: 'string'
              }
            }
          }
        },
      },
    },
    function (prev: any) {
      return prev.param;
    },
  );

  const trigger = flow.createTrigger('http');

  test('required', async function () {
    const res = await trigger({
      body: '{"key":1}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key2 required"}}');
  });

  test('verifiy undefined', async function () {
    const res = await trigger({
      body: '{"key":1, "key2": {"key3":1}, "key4": {}}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key5 verifiy undefined"}}');
  });

  test('correct', async function () {
    const res = await trigger({
      body: '{"key":1, "key1": 1, "key2":{"key3":1}}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual('{"data":{"key":1,"key1":1,"key2":{"key3":1}}}');
  });

  test('error_message', async function () {
    const res = await trigger({
      body: '{"key":1, "key1": 3}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key1 error_message"}}');
  });

  test('type error', async function () {
    const res = await trigger({
      body: '{"key":"1"}',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key type error"}}');
  });

  test('key6 type error', async function () {
    const res = await trigger({
      body: '{"key":1, "key2": {"key3": {"key6": "1"}} }',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key6 type error"}}');
  });

  test('key6 correct', async function () {
    const res = await trigger({
      body: '{"key":1, "key2": {"key3": {"key6": 1}} }',
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
    }, {});

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual('{"data":{"key":1,"key2":{"key3":{"key6":1}}}}');
  });

  test('error', async function () {
    const res = await trigger({}, {});

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual('{"error":{"message":"key required"}}');
  });
});
