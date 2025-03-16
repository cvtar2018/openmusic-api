const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const albumId = `album-${id}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [albumId, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError();
    }

    return result.rows[0].id;
  }

  async checkAlbumExist(albumId) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const albumResult = await this._pool.query(albumQuery);

    if (!albumResult.rows.length) {
      throw new NotFoundError('Album was not found');
    }

    return albumResult.rows[0];
  }

  async getAlbumById(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const albumResult = await this._pool.query(albumQuery);

    // console.log(albumResult);

    if (!albumResult.rows.length) {
      throw new NotFoundError('Album was not found');
    }
    const album = albumResult.rows[0];

    const songQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };
    const songsResult = await this._pool.query(songQuery);
    const songs = songsResult.rows;

    const albumData = {
      id: album.id,
      name: album.name,
      year: album.year,
      coverUrl: album.cover_url,
      songs: songs,
    };

    return albumData;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to Edit Album. Id was not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to delete. Album ID was not found');
    }
  }

  async editAlbumCover(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, albumId],
    };

    console.log(albumId);
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to update. Album Id was not found gaes');
    }
  }

  async checkAlbumLikeExist(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length) {
      throw new InvariantError('User already like this album');
    }
  }
  async addAlbumLike(albumId, userId) {
    const id = `likes-${nanoid(16)}`;
    console.log(albumId, userId);
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError();
    }

    return result.rows[0];
  }

  async deleteAlbumLike(albumId, userId) {
    console.log(albumId, userId);
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus like. Like Id tidak ditemukan');
    }
  }

  async getAlbumLikes(albumId) {
    console.log(albumId);
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(query);

    console.log(result.rows);

    return result.rows.length;
  }
}

module.exports = AlbumsService;
