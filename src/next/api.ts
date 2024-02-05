import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * If the API throws an error, it is passed back through this type.
 */
type Err = {
  /**
   * This is the HTTP status of the response.
   */
  status: number;
  /**
   * This is the error message sent by the API. It _should_ nbe displayable to the user.
   */
  message: string;
};

/**
 * An async function to call the API. You should always use the hook when possible, as this function does not handle sessions.
 * The URL to call. You need to include the /api prefix.
 * @param url
 * @param method The HTTP verb.
 * @param payload The JSON payload to send.
 * @returns Either returns the response from the server, or throws an error.
 */
export const api = <Response, Payload>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  payload?: Payload
): Promise<Response> =>
  fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  }).then(async (response) =>
    response.ok
      ? response.json()
      : Promise.reject({
          status: response.status,
          message: (await response.json()).message,
        })
  );

/**
 * The type returned by the `useQuery` hook.
 */
type Result<Data> =
  /**
   * If the call is still running, then it returns a simple array
   * with `true` as the first element. The two other elements are
   * `null`.
   */
  | [true, null, null]
  /**
   * If the call has errored, the array contains `false` as the
   * loading variable, then the error that happened, and finally
   * `null` for the result.
   */
  | [false, Err, null]
  /**
   * If the call has come through, the array contains `false` as the
   * loading variable, `null` for the error, and finally the data
   * returned by the API.
   */
  | [false, null, Data];

/**
 * A hook to fetch data from the API. This will make a GET request.
 *
 * @param url The URL to call. You need to include the /api prefix.
 * @returns This hook returns an array containing three values:
 *    - First is a `boolean`, indicating whether the query is still running or not
 *    - Then, either `null` or an `Error`, if the request fails. The error returned by the API _should_ always be displayable to the user
 *    - Finally, either `null` (if there was an error or if the resquest is still running), or the expected `Data`
 */
export const useQuery = <Data>(url: string): Result<Data> => {
  const [error, setError] = useState<Err | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const router = useRouter();

  useEffect(() => {
    api<Data, never>(url, "GET")
      .then((data) => {
        setData(data);
      })
      .catch((error: Err) => {
        if (error.status === 401) {
          router.push("/signin");
        }
        setError(error);
      });
  }, [url]);

  if (error) {
    return [false, error, null];
  }

  if (data) {
    return [false, null, data];
  }

  return [true, null, null];
};

type Method = "POST" | "PUT" | "DELETE";

/**
 * The type returned by the `useMutation` hook. The first element of
 * the array is always a function to call the API, as mutations should
 * happen on user input. While the last data returned by the API is
 * available as the last element of the array, it can also be accessed
 * from the promise returned by the call function.
 */
type MutationResult<Payload, Data> =
  /**
   * If the call hasn't been sent yet, or if it is running, then
   * it returns a simple array, with a boolean indicating the
   * loading state as the second element. The two last elements are
   * `null`.
   */
  | [(payload: Payload) => Promise<Data>, boolean, null, null]
  /**
   * If the call has errored, the array contains `false` as the
   * loading variable, then the error that happened, and finally
   * `null` for the result.
   */
  | [(payload: Payload) => Promise<Data>, false, Err, null]
  /**
   * If the call has come through, the array contains `false` as the
   * loading variable, `null` for the error, and finally the data
   * returned by the API.
   */
  | [(payload: Payload) => Promise<Data>, false, null, Data];

/**
 * A hook to send data to the API. This will make either a `POST`, `PUT` or `DELETE` request.
 *
 * @param url The URL to call. You need to include the /api prefix.
 * @param method The HTTP verb to use. Defaults to `POST`
 * @returns This hook returns an array containing four values:
 *    - First is a function to send data to the API. It returns a promise that will contain the data returned from the API (if it resolves)
 *    - Second is a `boolean`, indicating whether the query is still running or not
 *    - Then, either `null` or an `Error`, if the request fails. The error returned by the API _should_ always be displayable to the user
 *    - Finally, either `null` (if there was an error or if the resquest is still running), or the expected `Data`
 */
export const useMutation = <Payload, Data = never>(
  url: string,
  method: Method = "POST"
): MutationResult<Payload, Data> => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Err | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const router = useRouter();

  const call = async (payload: Payload) => {
    if (loading) {
      return Promise.reject();
    }

    setLoading(true);
    return api<Data, Payload>(url, method, payload)
      .then((data) => {
        setData(data);
        setLoading(false);

        return data;
      })
      .catch((error: Err) => {
        if (error.status === 401) {
          router.push("/signin");
        }

        setError(error);
        setLoading(false);

        return Promise.reject(error);
      });
  };

  if (error) {
    return [call, false, error, null];
  }

  if (data) {
    return [call, false, null, data];
  }

  return [call, loading, null, null];
};
