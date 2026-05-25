import { FileWithTransactionId, ManifestStorage } from '../types/storage.types';

export const getIngestionFilePath = (file: FileWithTransactionId) => {
  const datePath = getStorageDate();
  return `ingestion/${datePath}/files/${file.transactionId}/${file.originalname}`;
};

export const getIngestionManifestPath = (manifest: ManifestStorage) => {
  const datePath = getStorageDate();
  return `ingestion/${datePath}/manifests/${manifest.transactionId}-manifest.json`;
};

const getStorageDate = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}-${now.getUTCDate().toString().padStart(2, '0')}`;
};
