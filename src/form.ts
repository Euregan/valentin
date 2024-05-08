import { useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import type { Schema, ZodIssue } from "zod";

/**
 * A function to transform a zod error into a user friendly message
 *
 * @param issue The zod issue to transform
 * @returns The transformed error
 */
const issueToLabel = (issue: ZodIssue): string => {
  if (issue.code === "invalid_type" && issue.received === "null") {
    return "This field is required";
  }

  return issue.message;
};

interface HookParameters<Data> {
  /**
   * The initial form data. Can either be empty or prefilled.
   */
  initialData: {
    [K in keyof Data]: Data[K] extends Array<any> ? Data[K] : Data[K] | null;
  };
  /**
   * The function to call when the form is submitted and valid.
   *
   * @param data The validated data from the form.
   */
  onSubmit: (data: Data) => void | Promise<void>;
}

interface Form<Data, OnChanges, Errors> {
  /**
   * The `onSubmit` function to pass to your `form` tag.
   */
  onSubmit: (event: FormEvent) => void;
  /**
   * An object containing the onChange functions for your inputs.
   */
  onChanges: OnChanges;
  /**
   * An object containing the values for your inputs.
   */
  values: {
    [K in keyof Data]: Data[K] extends Array<any> ? Data[K] : Data[K] | null;
  };
  /**
   * An object containing the validation errors of your form.
   */
  errors: Errors;
  /**
   * Any error returned by the onSubmit call
   */
  submitError: string | null;
  /**
   * Whether the onSubmit call is running or not
   */
  submitting: boolean;
}

/**
 * This is a hook generator. You can either call it outside of your
 * component if your validation schema doesn't change, or within
 * if your valdation schema changes according to some props.
 *
 * @param validation The zod validation schema to validate your
 *    form input.
 * @returns The ready to be used form hook.
 */
export const createFormHook = <Validation extends Record<string, Schema>>(
  validation: Validation
) => {
  const schema = z.object(validation);
  type Data = z.infer<typeof schema>;

  type OnChanges = {
    [K in keyof Data]: (
      value: Data[K] extends Array<any> ? Data[K] : Data[K] | null
    ) => void;
  };

  type Errors = Record<keyof Data, string | undefined>;

  return ({
    initialData,
    onSubmit,
  }: HookParameters<Data>): Form<Data, OnChanges, Errors> => {
    const emptyErrors = Object.fromEntries(
      Object.entries(initialData).map(([key]) => [key, undefined])
    ) as Errors;

    const [data, setData] = useState(initialData);
    const [errors, setErrors] = useState<Errors>(emptyErrors);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<null | string>(null);

    const schema = z.object(validation);

    const onChanges = Object.fromEntries(
      (Object.entries(initialData) as Array<[keyof Data, unknown]>).map(
        ([key]) => [
          key,
          (value: Data[typeof key]) => setData({ ...data, [key]: value }),
        ]
      )
    ) as OnChanges;

    const submit = (event: FormEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const validation = schema.safeParse(data);

      if (validation.success) {
        setErrors(emptyErrors);
        const maybeAPromise = onSubmit(validation.data);

        if (maybeAPromise && "then" in maybeAPromise) {
          setSubmitting(true);
          setSubmitError(null);
          maybeAPromise
            .catch((error) => setSubmitError(error))
            .finally(() => setSubmitting(false));
        }
      } else {
        setErrors(
          Object.fromEntries(
            validation.error.issues.map((issue) => [
              issue.path,
              issueToLabel(issue),
            ])
          )
        );
      }
    };

    return {
      onSubmit: submit,
      onChanges,
      values: data,
      errors,
      submitError,
      submitting,
    };
  };
};

type NeoHookParameters<Validation, Data> = {
  /**
   * The zod validation schema to validate your form inputs.
   */
  validation: Validation;
  /**
   * The initial form data. Can either be empty or prefilled.
   */
  initialData: {
    [K in keyof Data]: Data[K] extends Array<any> ? Data[K] : Data[K] | null;
  };
  /**
   * The function to call when the form is submitted and valid.
   *
   * @param data The validated data from the form.
   */
  onSubmit: (data: Data) => void | Promise<void>;
};

/**
 * A simple hook to handle form submission, including input validation.
 */
export const useForm = <T extends object>({
  validation: schema,
  initialData,
  onSubmit,
}: NeoHookParameters<z.ZodType<T>, z.infer<z.ZodType<T>>>): Form<
  z.infer<z.ZodType<T>>,
  {
    [K in keyof z.infer<z.ZodType<T>>]: (
      value: z.infer<z.ZodType<T>>[K] extends Array<any>
        ? z.infer<z.ZodType<T>>[K]
        : z.infer<z.ZodType<T>>[K] | null
    ) => void;
  },
  Record<keyof z.infer<z.ZodType<T>>, string | undefined>
> => {
  const emptyErrors = Object.fromEntries(
    Object.entries(initialData).map(([key]) => [key, undefined])
  ) as Record<keyof z.infer<z.ZodType<T>>, string | undefined>;

  const [data, setData] = useState(initialData);
  const [errors, setErrors] =
    useState<Record<keyof z.infer<z.ZodType<T>>, string | undefined>>(
      emptyErrors
    );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<null | string>(null);

  const onChanges = Object.fromEntries(
    (
      Object.entries(initialData) as Array<
        [keyof z.infer<z.ZodType<T>>, unknown]
      >
    ).map(([key]) => [
      key,
      (value: z.infer<z.ZodType<T>>[typeof key]) =>
        setData({ ...data, [key]: value }),
    ])
  ) as {
    [K in keyof z.infer<z.ZodType<T>>]: (
      value: z.infer<z.ZodType<T>>[K] extends Array<any>
        ? z.infer<z.ZodType<T>>[K]
        : z.infer<z.ZodType<T>>[K] | null
    ) => void;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = schema.safeParse(data);

    if (validation.success) {
      setErrors(emptyErrors);
      const maybeAPromise = onSubmit(validation.data);

      if (maybeAPromise && "then" in maybeAPromise) {
        setSubmitting(true);
        setSubmitError(null);
        maybeAPromise
          .catch((error) => setSubmitError(error.message))
          .finally(() => setSubmitting(false));
      }
    } else {
      setErrors(
        Object.fromEntries(
          validation.error.issues.map((issue) => [
            issue.path,
            issueToLabel(issue),
          ])
        )
      );
    }
  };

  return {
    onSubmit: submit,
    onChanges,
    values: data,
    errors,
    submitError,
    submitting,
  };
};
