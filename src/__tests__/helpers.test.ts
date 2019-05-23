import Flow from '@faasjs/flow';
import httpTrigger from '../index';

describe('helpers', function () {
  describe('setHeader', function () {
    test('add', async function () {
      const flow = new Flow(
        {
          triggers: {
            http: {
              handler: httpTrigger,
            },
          },
        },
        function () {
          this.http.setHeader('X-HEADER', 'HEADER');
        }
      );

      const res = await flow.createTrigger('http')({}, {});

      expect(res.headers['X-HEADER']).toEqual('HEADER');
    });

    test('delete', async function () {
      const flow = new Flow(
        {
          triggers: {
            http: {
              handler: httpTrigger,
            },
          },
        },
        function () {
          this.http.setHeader('Content-Type', null);
        }
      );

      const res = await flow.createTrigger('http')({}, {});

      expect(Object.keys(res.headers)).toEqual(['X-Track-Id']);
    });
  });

  test('setStatusCode', async function () {
    const flow = new Flow(
      {
        triggers: {
          http: {
            handler: httpTrigger,
          },
        },
      },
      function () {
        this.http.setStatusCode(100);
      }
    );

    const res = await flow.createTrigger('http')({}, {});

    expect(res.statusCode).toEqual(100);
  });

  describe('setBody', function () {
    test('string', async function () {
      const flow = new Flow(
        {
          triggers: {
            http: {
              handler: httpTrigger,
            },
          },
        },
        function () {
          this.http.setBody('100');
        }
      );

      const res = await flow.createTrigger('http')({}, {});

      expect(res.body).toEqual('100');
    });

    test('object', async function () {
      const flow = new Flow(
        {
          triggers: {
            http: {
              handler: httpTrigger,
            },
          },
        },
        function () {
          this.http.setBody({ a: 1 });
        }
      );

      const res = await flow.createTrigger('http')({}, {});

      expect(res.body).toEqual('{"a":1}');
    });
  });
});
