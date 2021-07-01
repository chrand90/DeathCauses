import React from "react";

import RootStore, { withStore } from "../stores/rootStore";
import { observer } from "mobx-react";

interface FiloUploaderProps {
  store: RootStore;
}

class FileUploaderWithoutStore extends React.Component<FiloUploaderProps, any> {
  

  render() {
    return (
      <div>
          <p>test</p>
      </div>
    );
  }
}

const FileUploader = withStore(observer(FileUploaderWithoutStore));
export default FileUploader;
