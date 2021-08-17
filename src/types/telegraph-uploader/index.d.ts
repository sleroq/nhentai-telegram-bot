declare module 'telegraph-uploader' {
  import * as http from 'http'

  export function uploadByUrl(url: string, agent?: http.Agent): Promise<uploadResult>
  export function uploadByBuffer(buffer: Buffer, contentType: string, agent?: http.Agent): Promise<uploadResult>
  export interface uploadResult {
    link: string,
    path: string,
  }
}