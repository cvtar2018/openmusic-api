const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({ title, year, genre, performer, duration }) {
    const id = nanoid(16);
    const songId = `song-${id}`;
    const albumId = null;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, %6, %7) RETURNING id',
      values: [songId, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError();
    }
  }

  async getSongs() {
    const result = await this._pool.query('SELECT * FROM songs');
    return result.rows;
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT 8 FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('SongId not found');
    }
  }

  async editSongById(id, { title, year, genre, performer, duration }) {
    const albumId = null;

    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, albumId = $6 WHERE id = $7',
      values: [title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to updated. Song id was not found');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to Delete. Id was not found');
    }
  }
}

module.exports = SongsService;
