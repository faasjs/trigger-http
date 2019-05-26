import Flow from '@faasjs/flow';

interface Stack {
  type: string;
  id: string;
  time: number;
}

export async function handler (flow: Flow, trigger: any, data: {
  event: any;
  context: {
    trackId: string;
    history: Stack[];
    current: Stack;
  };
  [key: string]: any;
}) {
  flow.logger.debug('httpTrigger begin');

  // 预处理输入内容
  const input: {
    body: any;
    header: {
      [key: string]: string;
    };
    method: string;
    query: {
      [key: string]: string;
    };
    param: {
      [key: string]: any;
    };
  } = {
    body: data.event.body || null,
    header: data.event.header || {},
    method: data.event.method || 'GET',
    param: {},
    query: data.event.query || {},
  };

  if (input.header['Content-Type'] && input.header['Content-Type'].includes('application/json')) {
    input.body = JSON.parse(input.body);
  }

  let output: any = null;

  // 校验请求方法
  if (trigger.method && input.method !== trigger.method) {
    output = Error('Wrong method');
  }

  interface Config {
    required?: boolean;
    type?: string;
    handler?: (value: any) => any;
    error: string;
    internal: boolean;
  }

  function verification (data: any, config: Config, key: string, param: any) {
    // 必填项校验
    if (!config) {
      output = Error(`${key} verifiy undefined`);
      return;
    }

    if (config.required &&
      (
        !data ||
        typeof data[key as string] === 'undefined' ||
        data[key as string] === null
      )
    ) {
      output = Error(`${key} required`);
      return;
    }

    // 输入项类型校验
    if (config.type && data[key as string] && typeof data[key as string] !== config.type) {
      output = Error(`${key} type error`);
      return;
    }

    // 自定义校验
    if (config.handler && data[key as string] && config.handler!(data[key as string])) {
      output = Error(`${key} ${config.error || 'verification failed'}`);
      return;
    }

    // 递归 下一层
    if (config.internal && data[key as string]) {
      for (const internalKey in param) {
        if (internalKey === 'verifiy') { continue; }
        verification(data[key as string], param[internalKey as string].verifiy, internalKey, param[internalKey as string]);
      }
    }
  }

  // 校验参数
  if (trigger.param) {
    for (const key in trigger.param) {
      if (trigger.param.hasOwnProperty(key)) {
        // 只允许从 body 中读取参数
        // 递归校验
        verification(input.body, trigger.param[key as string].verifiy, key, trigger.param[key as string]);

        if (output) {
          break;
        }
        const value = input.body[key as string];

        // 将通过校验的数据存入 input.param
        input.param[key as string] = value;
      }
    }
  }

  // 注入 helpers
  let response: {
    headers: {
      [key: string]: any;
    };
    statusCode: number | null;
    body: string | null;
  } = {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Track-Id': data.context.trackId,
    },
    statusCode: null,
    body: null
  };

  // 若输入项校验通过，则触发流程
  if (output === null) {
    flow.helpers.http = {
      setHeader: function (key: string, value: any) {
        if (value === null || typeof value === 'undefined') {
          delete response.headers[key as string];
        } else {
          response.headers[key as string] = value;
        }
      },
      setStatusCode: function (code: number) {
        response.statusCode = code;
      },
      setBody: function (body: any) {
        if (typeof body !== 'string' && body !== null) {
          response.body = JSON.stringify(body);
        } else {
          response.body = body;
        }
      }
    };

    if (flow.mode === 'sync') {
      // 同步执行模式，执行全部步骤
      const result: any = {
        context: data.context,
        event: input,
        orgin: data.origin,
      };
      for (let i = 0; i < flow.steps.length; i++) {
        result.event = await flow.invoke(i, result);
      }
      output = result.event;
      flow.logger.debug('result %o', output);
    } else if (flow.mode === 'async') {
      // 异步模式，异步调用下一步，无返回
      await flow.remoteInvoke(0, input);
      output = null;
    }
  }

  // 处理结果并返回
  if (typeof output === 'undefined' || output === null) {
    // 没有结果或结果内容为空时，直接返回 201
    output = {
      statusCode: response.statusCode || 201,
    };
  } else if (output instanceof Error) {
    // 当结果是错误类型时
    output = {
      body: { error: { message: output.message } },
      statusCode: 500,
    };
  } else if (!output.statusCode) {
    output = {
      body: { data: output },
      statusCode: response.statusCode || 200,
    };
  }

  // 序列化 body
  if (typeof output.body !== 'undefined' && output.body !== 'string') {
    output.body = JSON.stringify(output.body);
  }

  response = Object.assign(response, output);

  // 返回响应
  flow.logger.debug('response %o', response);
  return response;
}
