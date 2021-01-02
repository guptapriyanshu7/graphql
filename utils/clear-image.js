import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();

export const clearImage = (imageUrl) => {
  const filePath = path.join(__dirname, imageUrl);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log(err);
    }
  });
};
