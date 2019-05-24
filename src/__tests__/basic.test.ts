import Flow from '@faasjs/flow';
import { handler } from '../index';

describe('basic', function () {
  describe('sync mode', function () {
    test('200', async function () {
      const flow = new Flow(
        {
          triggers: {
            http: {
              handler,
            },
          },
        },
        function (prev: any) {
          return prev.query.n + 1;
        },
        function (prev: any) {
          return prev + 2;
        },
      );

      const res = await flow.createTrigger('http')({ query: { n: 0 } }, {});

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual('{"data":3}');
      expect(res.headers['Content-Type']).toEqual('application/json; charset=UTF-8');
    });

    test('500', async function () {
      const flow = new Flow(
        {
          triggers: {
            http: {
              handler,
            },
          },
        },
        function () {
          throw Error('error');
        },
      );

      const res = await flow.createTrigger('http')({}, {});

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual('{"error":{"message":"error"}}');
    });
  });

  test('async mode', async function () {
    const flow = new Flow(
      {
        mode: 'async',
        triggers: {
          http: {
            handler,
          },
        },
      },
      function (prev: any) {
        return prev.query.n + 1;
      },
      function (prev: any) {
        return prev + 2;
      },
    );

    const res = await flow.createTrigger('http')({ query: { n: 0 } }, {});

    expect(res.statusCode).toEqual(201);
  });
});
