/* eslint-disable no-undef */
require('dotenv').config();

const Hapi = require('@hapi/hapi');
const albums = require('./api/albums');
const songs = require('./api/songs');
const SongsValidator = require('./validator/songs');
const AlbumsValidator = require('./validator/albums');
// const NotesService = require('./services/postgres/NotesService');
// const NotesValidator = require('./validator/notes');
// const ClientError = require('./exceptions/ClientError');

const init = async () => {
  // const notesService = new NotesService();
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
  ]);

  // server.ext('onPreResponse', (request, h) => {
  //   const { response } = request;

  //   if (response instanceof ClientError) {
  //     const newResponse = h.response({
  //       status: 'fail',
  //       message: response.message,
  //     });
  //     newResponse.code(response.statusCode);
  //     return newResponse;
  //   }
  //   return h.continue;
  // });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
