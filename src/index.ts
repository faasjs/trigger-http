import Flow from '@faasjs/flow';

export default async function httpTrigger(flow: Flow, trigger: any, data: {
  event: any;
  context: any;
  [key: string]: any;
}) {
  flow.logger.debug('httpTrigger %o', data);

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

  const outputHeaders = {
    'Content-Type': 'application/json; charset=UTF-8',
    // 'X-Request-Id': context.request_id
  };

  let output: any = null;

  // 输入项校验

  // 校验请求方法
  if (trigger.method && input.method !== trigger.method) {
    output = Error('Wrong method');
  }

  // 校验参数
  if (trigger.param) {
    for (const key in trigger.param) {
      if (trigger.param.hasOwnProperty(key)) {
        const config: {
          position?: 'header' | 'query' | 'body';
          required?: boolean;
          [key: string]: any;
        } = trigger.param[key];

        // 默认从 body 中读取参数
        if (!config.position) {
          config.position = 'body';
        }

        // 必填项校验
        if (config.required &&
          (
            !input[config.position] ||
            typeof input[config.position][key] === 'undefined' ||
            input[config.position][key] === null
          )
        ) {
          output = Error(`${key} required`);
          break;
        }

        const value = input[config.position][key];

        // 将通过校验的数据存入 input.param
        input.param[key] = value;
      }
    }
  }

  // 若输入项校验通过，则触发流程
  if (output === null) {
    if (flow.config.mode === 'sync') {
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
    } else if (flow.config.mode === 'async') {
      // 异步模式，异步调用下一步，无返回
      await flow.remoteInvoke(0, input);
      output = null;
    }
  }

  // 处理结果并返回
  if (typeof output === 'undefined' || output === null) {
    // 没有结果或结果内容为空时，直接返回 201
    output = {
      statusCode: 201,
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
      statusCode: 200,
    };
  }

  // 注入公共响应头
  output.headers = Object.assign(output.headers || {}, outputHeaders);

  // 序列化 body
  if (typeof output.body !== 'string') {
    output.body = JSON.stringify(output.body);
  }

  // 返回响应
  flow.logger.debug('response %o', output);
  return output;
}
