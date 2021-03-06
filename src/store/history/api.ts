import { get, post, sse } from '@/helpers/fetch';
import { snakeCased } from '@/helpers/functional';
import { QueryParams, QueryTarget } from '@/store/history/state';
import queryString from 'query-string';

const snakeCasedObj = (obj: any) =>
  Object.keys(obj)
    .filter(key => !!obj[key])
    .reduce((acc: any, key: string) => ({ ...acc, [snakeCased(key)]: obj[key] }), {});

const formatTime = (val?: string | number): string | undefined =>
  (Number.isNaN(Number(val))
    ? val as string
    : new Date(Number(val)).toUTCString());

const timeFormatted = (params: QueryParams) =>
  ({
    ...params,
    start: formatTime(params.start),
    end: formatTime(params.end),
  });

export const fetchValueSource = async (
  params: QueryParams,
  target: QueryTarget,
) =>
  sse(`/history/sse/values?${queryString.stringify({
    ...snakeCasedObj(timeFormatted(params)),
    ...snakeCasedObj(target),
  })}`);

export const fetchKnownKeys = async () =>
  post('/history/query/objects', {});

export const validateService = async (): Promise<boolean> =>
  get('/history/_service/status')
    .then(retv => retv.status === 'ok')
    .catch(() => false);
