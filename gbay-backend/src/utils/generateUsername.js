async function generateUsername(baseUsername, db) {

  let username = baseUsername;

  while (true) {

    const [rows] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return username;
    }

    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    username = `${baseUsername}${randomNumber}`;

  }

}

module.exports = generateUsername;