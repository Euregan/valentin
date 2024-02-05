import * as jsonwebtoken from "jsonwebtoken";

/**
 * The user information contained in the JWT
 */
export type JwtUser = {
  /**
   * The user's id
   */
  id: string;
  /**
   * The user's email
   */
  email: string;
  /**
   * The user's account id
   */
  accountId: string;
};

/**
 * The function to use to create a JWT from a user information.
 *
 * @param user The user's information to put in the JWT
 * @returns The JWT to send to the client
 */
const create = (user: JwtUser) =>
  jsonwebtoken.sign(user, process.env.JWT_SECRET as string);

/**
 * The function to use to retrieve user information from a JWT
 *
 * @param token The JWT token to read from
 * @returns The user's information
 */
const read = (token: string): JwtUser =>
  jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as JwtUser;

const jwt = { create, read };

export default jwt;
