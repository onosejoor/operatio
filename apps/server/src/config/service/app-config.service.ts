import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../env.config';

type Primitive = string | number | boolean | undefined | null;

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Primitive
    ? K
    : T[K] extends Record<string, unknown>
      ? `${K}.${PathImpl<T[K], keyof T[K]>}`
      : never
  : never;

export type Path<T> = PathImpl<T, keyof T> | keyof T;

export type PathValue<
  T,
  P extends Path<T>,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvConfig>) {}

  get<P extends Path<EnvConfig>>(path: P): PathValue<EnvConfig, P> {
    return this.configService.get(path, {
      infer: true,
    }) as PathValue<EnvConfig, P>;
  }
}
