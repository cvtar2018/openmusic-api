const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { service, validator, usersService }) => {
    const albumsHandler = new AlbumsHandler(service, validator, usersService);
    server.route(routes(albumsHandler));
  },
};
