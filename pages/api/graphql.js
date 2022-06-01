import { ApolloServer, gql } from "apollo-server-micro";
const fs = require("fs");
import path from "path";
import fsPromises from "fs/promises";

const typeDefs = gql`
  type Blog {
    id: String
    text: String
  }

  type Query {
    blogs: [Blog]
  }

  type Mutation {
    addBlog(text: String): Blog
    editBlog(id: String, text: String): Blog
    deleteBlog(id: String): Blog
  }
`;
const resolvers = {
  Query: {
    // query from studio: {blogs {id,text}}
    blogs: async (_parent, _args, _context) => {
      const fileData = await readFile();
      console.log({ fileData: JSON.parse(fileData) });
      return JSON.parse(fileData);
    },
  },
  Mutation: {
    addBlog: async (_parent, { text }, _context) => {
      const fileData = await readFile();
      const arr = JSON.parse(fileData);
      const lastIndexId = arr.at(-1).id;
      arr.push({ id: lastIndexId + 1, text });
      await writeFile(JSON.stringify(arr));
      return { lastIndexId, text };
    },
    editBlog: async (_parent, { id, text }, _context) => {
      const fileData = await readFile();
      const arr = JSON.parse(fileData);
      const index = arr.findIndex((element) => element.id.toString() === id);
      arr[index].text = text;
      await writeFile(JSON.stringify(arr));
      return arr[index];
    },
    deleteBlog: async (_parent, { id }, _context) => {
      const fileData = await readFile();
      const arr = JSON.parse(fileData);
      const index = arr.findIndex((element) => element.id.toString() === id);
      const removedElement = arr.splice(index, 1);
      await writeFile(JSON.stringify(arr));
      return removedElement[0];
    },
  },
};

const getFilePath = () => {
  return path.join(process.cwd(), "blogs.json");
};

const readFile = async () => {
  return await fsPromises.readFile(getFilePath());
};

const writeFile = async (data) => {
  return await fsPromises.writeFile(getFilePath(), data, (err) => {
    if (err) console.log(err);
    else {
      console.log("File written successfully\n");
    }
  });
};

const apolloServer = new ApolloServer({ typeDefs, resolvers });
const startServer = apolloServer.start();

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://studio.apollographql.com"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Methods, Access-Control-Allow-Origin, Access-Control-Allow-Credentials, Access-Control-Allow-Headers"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, PUT, PATCH, DELETE, OPTIONS, HEAD"
  );
  if (req.method === "OPTIONS") {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}
