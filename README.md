# Valentin

A collection of utilities to share across projects.

## Utilities

### `valentin/form`

This utility exposes a hook generator. The hook can be used to validate forms.
It makes sure the data is valid, and returns properly typed values.

### `valentin/jwt`

This utility exposes functions to create and read a simple JWT. It relies on an
environment var called `JWT_SECRET`.

### `valentin/Result`

This utility exposes a simple Result object, to handle errors in a more
functional (and typed) manner.

### `valentin/next/api`

This utility exposes helpers to call the API from the client side. You can use
`useQuery` to make `GET` calls, and `useMutation` to make `POST`, `PUT` or
`DELETE` calls. It will automatically forward the current user JWT.

### `valentin/next/endpoint`

This utility exposes helpers to create API endpoints on the server side. More
information on how to setup an API endpoint can be found in
[the API section of this documentation](#api).
