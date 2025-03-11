const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name = 'untitled' } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist({ name, owner: credentialId });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;

    const playlists = await this._service.getPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongsPayload(request.payload);
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    await this._service.addSongToPlaylist(playlistId, songId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan lagu pada playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistByIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.checkPlaylistExist(playlistId);

    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    const result = await this._service.getPlaylistById(playlistId);

    const response = h.response({
      status: 'success',
      data: {
        playlist: result,
      },
    });
    return response;
  }

  async deleteSongFromPlaylistHandler(request) {
    this._validator.validatePlaylistSongsPayload(request.payload);
    const { songId } = request.payload;
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.checkPlaylistExist(playlistId);

    await this._service.verifyPlaylistAccess(playlistId, credentialId);

    await this._service.deleteSongFromPlaylist(playlistId, songId, credentialId);

    return {
      status: 'success',
      message: 'Berhasil menghapus lagu dari playlist.',
    };
  }

  async deletePlaylistHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.deletePlaylist(playlistId, credentialId);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, credentialId);

    const result = await this._service.getPlaylistActivities(playlistId, credentialId);

    return {
      status: 'success',
      data: {
        playlistId: playlistId,
        activities: result,
      },
    };
  }
}

module.exports = PlaylistsHandler;
