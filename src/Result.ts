type Internal<Data, Error> =
  | { ok: true; data: Data }
  | { ok: false; error: Error };

/**
 * A simple Result class to handle errors in a functional (and typed) way.
 */
export default class Result<Data, Error> {
  private internal: Internal<Data, Error>;

  private constructor(internal: Internal<Data, Error>) {
    this.internal = internal;
  }

  /**
   * A constructor for a successful Result.
   *
   * @param data The data to be held by the Result
   * @returns The result with the data
   */
  static ok = <E, D>(data: D): Result<D, E> =>
    new Result<D, E>({ ok: true, data });

  /**
   * A constructor for a failed Result.
   *
   * @param error The error to be held by the Result
   * @returns The result with the error
   */
  static err = <E, D>(error: E): Result<D, E> =>
    new Result<D, E>({ ok: false, error });

  /**
   * This functions allows you to process the Result's
   * data if it's successful. If it has failed, then this
   * will simply be skipped.
   *
   * @param fun A function transforming data.
   * @returns A new Result, with the transformed data.
   */
  map = <Out>(fun: (data: Data) => Out): Result<Out, Error> =>
    this.internal.ok
      ? Result.ok(fun(this.internal.data))
      : Result.err(this.internal.error);

  /**
   * A function allowing you to extract data or the error
   * from the Result. You need to provide a function to handle
   * both success and failure. They do not have to return the
   * same type
   *
   * @param success The function to be called if the Result is successful
   * @param failure The function to be called if the Result has failed
   * @returns Either the successful data or the transformed error
   */
  unwrap = <T, U>(success: (data: Data) => T, failure: (error: Error) => U) =>
    this.internal.ok
      ? success(this.internal.data)
      : failure(this.internal.error);

  /**
   * This function allos you to process the Result's
   * data if it's successful. If it has failed, then this
   * will simply be skipped. The difference with the map
   * function is that this function expects a Result, so
   * you can use this to handle faillible tasks.
   *
   * @param fun A function doing data transformation that could fail.
   * @returns A new Result, with the transformed data, or with an error
   */
  andThen = <DataOut, ErrorOut>(
    fun: (data: Data) => Result<DataOut, ErrorOut>
  ): Result<DataOut, ErrorOut | Error> =>
    this.internal.ok
      ? fun(this.internal.data)
      : Result.err(this.internal.error);

  /**
   * A function quite like `andThen`, but that works with
   * promises. You will have to handle the failure case of
   * the promise though, as the error type cannot be ensured
   * internally.
   *
   * @see andThen
   * @param fun A function doing async data transformation that could fail.
   * @returns A new Result, wrapped in a promise, with the transformed data, or with an error
   */
  andThenPromise = <DataOut, ErrorOut>(
    fun: (data: Data) => Promise<Result<DataOut, ErrorOut>>
  ): Promise<Result<DataOut, ErrorOut | Error>> =>
    this.internal.ok
      ? fun(this.internal.data)
      : Promise.resolve(Result.err(this.internal.error));
}
