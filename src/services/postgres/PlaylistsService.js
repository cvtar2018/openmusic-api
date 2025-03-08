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
    await this.addActivityToPlaylist(playlistId, songId, credentialId, 'add');
    return result.rows[0].id;
  }

  async getPlaylistById(playlistId, credentialId) {
    // console.log(`playlistId: ${playlistId} || songId: ${songId} || userId: ${credentialId}`);

    // check dulu kalo playlist dengan id yang diberikan exist gaes
    const query = {
      text: 'SELECT id FROM playlists WHERE id = $1',
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

    await this.addActivityToPlaylist(playlistId, songId, credentialId, 'delete');
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
    console.log(`verifying playlist owner >>>>>>>>> owner: ${owner}`);

    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1 AND owner = $2',
      values: [id, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addActivityToPlaylist(playlistId, songId, credentialId, action) {
    const activityId = `act-${nanoid(16)}`;
    const time = new Date().toISOString();
    console.log(time);
    const addActivityQuery = {
      text: 'INSERT INTO playlist_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [activityId, playlistId, songId, credentialId, action, time],
    };

    const result = await this._pool.query(addActivityQuery);
    console.log(
      `adding activity to playlist >>> playlistId: ${playlistId} || songId: ${songId} || userId: ${credentialId}`
    );

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan aktivitas');
    }
  }
  async getPlaylistActivities(playlistId, credentialId) {
    console.log(
      `getting playlist activity lho >>>> playlistId: ${playlistId}, credId: ${credentialId}`
    );
    const playlistCheckQuery = {
      text: 'SELECT id FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const playlistCheck = await this._pool.query(playlistCheckQuery);
    if (!playlistCheck.rows.length) {
      throw new NotFoundError('id playlist tidak ditemukan');
    }

    await this.verifyPlaylistOwner(playlistId, credentialId);

    const query = {
      text: `SELECT users.username, songs.title, playlist_activities.action, playlist_activities.time
            FROM playlist_activities
            LEFT JOIN songs ON songs.id = playlist_activities.song_id
            LEFT JOIN users ON users.id = playlist_activities.user_id
            LEFT JOIN playlists ON playlists.id = playlist_activities.playlist_id
            WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = PlaylistsService;
