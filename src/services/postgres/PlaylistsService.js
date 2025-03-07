const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
// const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsService {
  constructor(songsService) {
    this._pool = new Pool();
    this._songsService = songsService;
  }

  async addPlaylist({ name, owner }) {
    console.log(`name: ${name}, owner: ${owner}`);
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username
            FROM playlists
            LEFT JOIN users
            ON users.id = playlists.owner
            WHERE playlists.owner = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async addSongToPlaylist(playlistId, songId, credentialId) {
    console.log(`playlistId: ${playlistId} || songId: ${songId} || userId: ${credentialId}`);

    await this.verifyPlaylistOwner(playlistId, credentialId);
    await this._songsService.getSongById(songId);

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2) RETURNING playlist_id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    console.log(result);

    if (!result.rows[0].playlist_id) {
      throw new InvariantError('Gagal menambahan lagu ke playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistById(playlistId, credentialId) {
    // console.log(`playlistId: ${playlistId} || songId: ${songId} || userId: ${credentialId}`);

    // check dulu kalo playlist dengan id yang diberikan exist gaes
    const query = {
      text: 'SELECT id FROM Playlists WHERE id = $1',
      values: [playlistId],
    };
    const playlistCheck = await this._pool.query(query);
    if (!playlistCheck.rows.length) {
      throw new NotFoundError('id playlist tidak ditemukan');
    }

    await this.verifyPlaylistOwner(playlistId, credentialId);

    const playlistQuery = {
      text: `SELECT playlists.id, playlists.name, users.username
            FROM playlists
            LEFT JOIN users
            ON users.id = playlists.owner
            WHERE playlists.id = $1`,
      values: [playlistId],
    };
    const playlistResult = await this._pool.query(playlistQuery);
    const playlist = playlistResult.rows[0];
    if (!playlist) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlistSongsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer
            FROM songs
            LEFT JOIN playlist_songs
            ON playlist_songs.song_id = songs.id
            WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };
    const playlistSongsResult = await this._pool.query(playlistSongsQuery);
    const playlistSongs = playlistSongsResult.rows;

    const result = {
      id: playlist.id,
      name: playlist.name,
      username: playlist.username,
      songs: playlistSongs,
    };
    return result;
  }

  async deleteSongFromPlaylist(playlistId, songId, credentialId) {
    console.log(`playlistId: ${playlistId} || songId: ${songId} || userId: ${credentialId}`);
    await this.verifyPlaylistOwner(playlistId, credentialId);

    const query = {
      text: 'DELETE FROM playlist_songs WHERE song_id = $1 RETURNING song_id',
      values: [songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus lagu. Id tidak ditemukan');
    }
  }

  async deletePlaylist(id, owner) {
    await this.verifyPlaylistOwner(id, owner);

    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus playlist. Id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    console.log(`owner: ${owner}`);

    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1 AND owner = $2',
      values: [id, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }
}

module.exports = PlaylistsService;
