import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { ApplicationState } from "../../store/root/applicationState";
import { initializeGallery, destroyGallery, setGalleryActiveItemSuccess } from "../../store/gallery/actions";
import { IUITreeNode } from "../../api/models/file-explorer.model";
import FileViewerModel, { fileViewerMap } from "../../api/models/file-viewer.model";
import GalleryWrapper from "../gallery/GalleryWrapper";
import ViewerDisplay from "./displays/ViewerDisplay";
import { LoadingComponent } from "..";
import GalleryModel, { IGalleryItem, galleryActions } from "../../api/models/gallery.model";
import _ from "lodash";
import "./file-detail.scss";
import { IGalleryState } from "../../store/gallery/types";

interface IPropsFromDispatch {
  initializeGallery: typeof initializeGallery;
  setGalleryActiveItemSuccess: typeof setGalleryActiveItemSuccess;
  destroyGallery: typeof destroyGallery;
}
type AllProps = {
  selectedFile: IUITreeNode;
  selectedFolder: IUITreeNode;
} & IGalleryState & IPropsFromDispatch;

class GalleryView extends React.Component<AllProps> {
  _isMounted = false;
  constructor(props: AllProps) {
    super(props);
    const { selectedFile, selectedFolder, initializeGallery } = this.props;
    initializeGallery({ selectedFile, selectedFolder });
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate(prevProps: AllProps) {
    const { selectedFile, selectedFolder, initializeGallery, setGalleryActiveItemSuccess, destroyGallery,galleryItem, galleryItems } = this.props;
    if (selectedFolder.uiId !== prevProps.selectedFolder.uiId) {  // Load new folder items and reset
      destroyGallery(); // NOTES: Needs to destroy loading processes ***** WORKING
      initializeGallery({ selectedFile, selectedFolder });
    } else if ( !!galleryItems && selectedFile.uiId !== prevProps.selectedFile.uiId) {
      // NOTES: If folder is the same Find Gallery item and load that
      // FIND FILE IN GALLERY ITEMS AND SET
      const newIndex = GalleryModel.getGalleryItemIndex(selectedFile.uiId, galleryItems);
      setGalleryActiveItemSuccess(galleryItems[newIndex]); // NEEDS TO COMPLETE FOLDER LOADING ***** WORKING
    }
  }

  render() {
    return (
     this.renderContent()
    )
  }

  // Decription: Render the individual viewers by filetype
  renderContent() {
    const { galleryItem, galleryItems } = this.props;
    const viewerName = (!!galleryItem && !!galleryItem.fileType) ? fileViewerMap[galleryItem.fileType] : "";
    return (
      <GalleryWrapper
        index={!!galleryItem ? galleryItem.index : 0}
        total={galleryItems.length || 0}
        handleOnToolbarAction={(action: string) => { (this.handleGalleryActions as any)[action].call(); }}>
        {
          (!!galleryItem && !!galleryItem.blob) ?
            <ViewerDisplay tag={viewerName} file={galleryItem} /> :
            <LoadingComponent color="#fff" />
        }
      </GalleryWrapper>
    )
  }

  // Description: change the gallery item state
  // WORKING NEED TO HANDLE LIMITS ***** tbd
  _playInterval: any = undefined;
  handleGalleryActions = {
    next: () => {
      const { galleryItem, galleryItems, setGalleryActiveItemSuccess } = this.props;
      if (!!galleryItem) {
        const i = galleryItem.index,
          newIndex = (i + 1 < galleryItems.length) ? (i + 1) : 0;
        !_.isEqual(galleryItem, galleryItems[newIndex]) && setGalleryActiveItemSuccess(galleryItems[newIndex]);
      }
    },
    previous: () => {
      const { galleryItem, galleryItems, setGalleryActiveItemSuccess } = this.props;
      if (!!galleryItem) {
        const i = galleryItem.index,
          newIndex = (i > 0) ? (i - 1) : 0;
        !_.isEqual(galleryItem, galleryItems[newIndex]) && setGalleryActiveItemSuccess(galleryItems[newIndex]);
      }
    },
    play: () => {
      this._playInterval = setInterval(() => {
        (this.handleGalleryActions as any)[galleryActions.next].call();
      }, 200);
    },
    pause: () => {
      clearInterval(this._playInterval);
    },
    download: () => { // TO be done
      const { galleryItem } = this.props;
      !!galleryItem && FileViewerModel.downloadFile(galleryItem.blob, galleryItem.fileName);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.props.destroyGallery();
  }
}


const mapDispatchToProps = (dispatch: Dispatch) => ({
  initializeGallery: (data: { selectedFile: IUITreeNode; selectedFolder: IUITreeNode; }) => dispatch(initializeGallery(data)),
  setGalleryActiveItemSuccess: (galleryItem: IGalleryItem) => dispatch(setGalleryActiveItemSuccess(galleryItem)),
  destroyGallery: () => dispatch(destroyGallery())
});

const mapStateToProps = ({ gallery }: ApplicationState) => ({
  galleryItem: gallery.galleryItem,
  galleryItems: gallery.galleryItems
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GalleryView);
// export default GalleryView;
