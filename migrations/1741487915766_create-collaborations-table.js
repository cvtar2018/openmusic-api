/* eslint-disable camelcase */
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('playlist_collaborations', {
    collab_id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'playlist_collaborations',
    'unique_playlist_id_and_user_id',
    'UNIQUE(playlist_id, user_id)'
  );

  pgm.addConstraint(
    'playlist_collaborations',
    'fk_playlist_collaborations.playlist_id_playlists.id',
    'FOREIGN KEY(playlist_id) REFERENCES playlist(id) ON DELETE CASCADE'
  );
  pgm.addConstraint(
    'playlist_collaborations',
    'fk_playlist_collaborations.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('playlist_collaborations');
};
