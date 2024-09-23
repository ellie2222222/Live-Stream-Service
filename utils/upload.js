import axios from "axios";
import fs from "fs";

const handleFileUpload = async (file) => {
  const fileStream = fs.createReadStream(file.path);

  const name = file.originalname.trim().replace(/\s+/g, "%20");

  const uniqueName = `${Date.now()}-${file.filename}-${name}`;

  const response = await axios.put(
    `https://sg.storage.bunnycdn.com/live-stream-service/${uniqueName}`,
    fileStream,
    {
      headers: {
        AccessKey: "e68740b8-e7b2-4df2-82b616b8ab35-77e2-42d6",
      },
    }
  );

  if (response.data) {
    return `https:/live-stream-service.b-cdn.net/${uniqueName}`;
  } else {
    return false;
  }
};

export default handleFileUpload;
