import { buildConfig, Config, omit } from './buildConfig'
import { buildUrl } from './buildUrl'

type PlainObject = Record<string, any>
type ParamValue = string | number | Date | boolean | null | undefined

export interface SharedConfig<D = any> extends Omit<RequestInit, 'body' | 'method'> {
   baseUrl?: string | URL
   serializeParams?: (params: RequestConfig['params']) => string
   serializeBody?: (body: PlainObject | Array<any>) => string
   parseSuccess?: (response: Response) => Promise<D>
   parseError?: (res: Response) => Promise<any>
   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'HEAD'
}

export interface FactoryConfig<DD = any> extends SharedConfig<DD> {
   onFetchStart?: (config: Config, url: string) => void
   onError?: (error: any) => void
   onSuccess?: (error: any) => void
}

export interface RequestConfig<D = any> extends SharedConfig<D> {
   url?: string
   params?: string | Record<string, ParamValue | ParamValue[]>
   body?: BodyInit | PlainObject | Array<any> | null
}

export const createFetcher = <DD = any>(
   factoryConfig?: () => FactoryConfig<DD>,
   fetchFn: typeof fetch = fetch,
) => {
   return async <D = DD>(requestConfig?: RequestConfig<D>) => {
      const config = buildConfig(factoryConfig?.(), requestConfig)
      const url = buildUrl(config)

      config.onFetchStart(config, url)

      return await fetchFn(url, config)
         .then(async (res) => {
            if (res.ok) {
               const data: D = await config.parseSuccess(res)
               config.onSuccess(data)
               return data
            } else {
               throw await config.parseError(res)
            }
         })
         .catch((error) => {
            config.onError(error)
            throw error
         })
   }
}
