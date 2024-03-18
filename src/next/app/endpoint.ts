import { z, ZodSchema } from "zod";
import { jwt, JwtUser, Result } from "../..";
import { NextRequest } from "next/server";

/**
 * This is the error returned by any endpoint when something goes wrong.
 */
export type Error = {
  /**
   * This is the HTTP status code to send back
   */
  code: number;
  /**
   * This is the message that should be displayed to the user
   */
  message: string;
};

/**
 *  A helper for authenticated endpoints
 *
 * @param handler The function to handle the call. It will only
 *    be called if the data sent is valid. It is given two parameters:
 *      - The first is the user making the call. It is either a `JwtUser`
 *        if it's coming from the app, or an `ApiKey` if it's coming from
 *        a third party API call.
 *      - The second parameter is the payload of the call (if applicable).
 *        It has been parsed according to the provided validator.
 * @param validator A zod validation schema to validate incoming data.
 *    Route parameters, URL parameters and JSON body will be merged
 *    together. If you do not expect data, you do not have to pass a
 *    validator.
 */
export const authentified =
  <ValidationSchema extends ZodSchema, R>(
    handler: (
      user: JwtUser,
      payload: z.infer<ValidationSchema>
    ) => Promise<Result<R, Error>>,
    validator?: ValidationSchema
  ) =>
  async (
    request: NextRequest,
    params: Record<string, string>
  ): Promise<Response> => {
    const apiKey =
      request.headers.has("authorization") &&
      request.headers.get("authorization")!.split("Bearer ")[1];

    const token = request.cookies.get("jwt");

    if (!token && !apiKey) {
      return resultToResponse(
        Result.err({
          code: 401,
          message: "Your session has expired. Please signin again.",
        })
      );
    }

    try {
      const user = token ? jwt.read(token.value) : null;

      if (!user) {
        return resultToResponse(
          Result.err({
            code: 401,
            message: "Please provide a mean of authentification.",
          })
        );
      }

      return visitor((payload) => handler(user, payload), validator)(
        request,
        params
      );
    } catch (error) {
      return resultToResponse(
        Result.err({
          code: 401,
          message: "Your session has expired. Please signin again.",
        })
      );
    }
  };

/**
 *  A helper for unauthenticated endpoints
 *
 * @param handler The function to handle the call. It will only
 *    be called if the data sent is valid. It is given two parameters:
 *    - The first is the payload of the call (if applicable). It has been parsed
 *    according to the provided validator.
 *    - The second is the user making the call, if there is one.
 * @param validator A zod validation schema to validate incoming data.
 *    Route parameters, URL parameters and JSON body will be merged
 *    together. If you do not expect data, you do not have to pass a
 *    validator.
 */
export const visitor =
  <ValidationSchema extends ZodSchema, R>(
    handler: (
      payload: z.infer<ValidationSchema>,
      user?: JwtUser
    ) => Promise<Result<R, Error>>,
    validator?: ValidationSchema
  ) =>
  async (
    request: NextRequest,
    params: Record<string, string>
  ): Promise<Response> => {
    let payload: z.infer<ValidationSchema> = undefined;

    if (validator) {
      const validation = validator.safeParse({
        ...request.body,
        ...Object.fromEntries(request.nextUrl.searchParams.entries()),
        ...params,
      });
      if (validation.success) {
        payload = validation.data;
      } else {
        return resultToResponse(
          Result.err({
            code: 400,
            message: validation.error.message,
          })
        );
      }
    }

    const token = request.cookies.get("jwt");
    const user: JwtUser | undefined = token ? jwt.read(token.value) : undefined;

    return resultToResponse(await handler(payload, user));
  };

/**
 * A simple helper transforming a `Result` in a `NextApiResponse`.
 */
const resultToResponse = <Data>(result: Result<Data, Error>): Response =>
  result.unwrap(
    (data) => Response.json(data),
    (error) =>
      new Response(JSON.stringify({ message: error.message }), {
        status: error.code,
      })
  );
