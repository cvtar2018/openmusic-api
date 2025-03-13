const autoBind = require('auto-bind');
// const ClientError = require('../../exceptions/ClientError');

class ExportsHandler {
  constructor(service, validator, playlistsService) {
    this._service = service;
    this._validator = validator;
    this._playlistsService = playlistsService;

    autoBind(this);
  }

  async postExportPlaylistHandler(request, h) {
    this._validator.validateExportPlaylistPayload(request.payload);
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    const message = {
      playlistId: playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this._playlistsService.checkPlaylistExist(playlistId);

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);

    await this._service.sendMessage('export:playlist', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
