import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios"; 

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    console.log("uploadFile to", url);

    const urlforGetSASUrl =
      "https://fa-import-service-dev-ne-001.azurewebsites.net/api/import";
    // Get the presigned URL
    console.log("uploadFile to urlforGetSASUrl", urlforGetSASUrl);
    const response = await axios({
      method: "GET", 
      url: urlforGetSASUrl,
      params: {
        name: encodeURIComponent("products-service-blob"),
      },
    });
    console.log("File to upload: ", "products-service-blob");
    console.log("Uploading to url: ", response.data.sasUrl);
    
    const config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: response.data.sasUrl,
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'application/octet-stream'
      },
      data: file
    };

    try {
      const result = await axios.request(config);
      console.log("Upload successful:", JSON.stringify(result.data));
    } catch (error) {
      console.error("Upload failed:", error);
    }
    
    setFile(undefined);
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file!</button>
        </div>
      )}
    </Box>
  );
}
