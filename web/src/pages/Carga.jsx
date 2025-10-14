/**
 * Página de Carga de Datos
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useState } from 'react';
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

const Carga = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.name.endsWith('.csv')) {
        setError('Solo se permiten archivos CSV');
        setSelectedFile(null);
        return;
      }

      // Validar tamaño (20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 20MB');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo primero');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const response = await apiService.uploadCSV(selectedFile, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });

      setUploadResult(response.data.data);
      setSelectedFile(null);
      
      // Reset input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      setError(
        err.response?.data?.error || 
        'Error al subir el archivo. Verifica tu conexión e intenta de nuevo.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileSelect({ target: { files: [file] } });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Carga de Datos
        </h1>
        <p className="text-lg opacity-70">
          Importar archivo CSV con datos de trámites
        </p>
      </div>

      {/* Instrucciones */}
      <div className="alert alert-info">
        <DocumentTextIcon className="h-6 w-6" />
        <div>
          <h3 className="font-bold">Formato del archivo CSV</h3>
          <div className="text-sm mt-1">
            El archivo debe contener las siguientes columnas:
            <code className="block mt-2 p-2 bg-base-100 rounded">
              dependencia, tramite, nivel_digitalizacion, fase1_tramites_intervenidos,
              fase2_modelado, fase3_reingenieria, fase4_digitalizacion,
              fase5_implementacion, fase6_liberacion
            </code>
          </div>
        </div>
      </div>

      {/* Zona de Carga */}
      <div className="card-executive">
        <div
          className={`border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
            selectedFile
              ? 'border-success bg-success/5'
              : 'border-base-300 hover:border-primary hover:bg-primary/5'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-4">
              <CheckCircleIcon className="h-16 w-16 text-success mx-auto" />
              <div>
                <p className="font-bold text-lg">{selectedFile.name}</p>
                <p className="text-sm opacity-70">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  className="btn btn-success gap-2"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Subiendo... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-5 w-5" />
                      Subir Archivo
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ArrowUpTrayIcon className="h-16 w-16 text-primary mx-auto" />
              <div>
                <p className="font-bold text-lg mb-2">
                  Arrastra y suelta tu archivo CSV aquí
                </p>
                <p className="text-sm opacity-70 mb-4">o</p>
                <button
                  className="btn btn-primary"
                  onClick={() => document.getElementById('file-input').click()}
                >
                  Seleccionar Archivo
                </button>
              </div>
              <p className="text-xs opacity-60">
                Tamaño máximo: 20 MB
              </p>
            </div>
          )}
        </div>

        {/* Barra de Progreso */}
        {uploading && (
          <div className="mt-4">
            <progress
              className="progress progress-primary w-full"
              value={uploadProgress}
              max="100"
            ></progress>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error shadow-lg">
          <ExclamationCircleIcon className="h-6 w-6" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultado de la Carga */}
      {uploadResult && (
        <div className="card-executive bg-success/10 border-2 border-success">
          <div className="flex items-start gap-4">
            <CheckCircleIcon className="h-12 w-12 text-success flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-success mb-4">
                ¡Archivo procesado exitosamente!
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="stat bg-base-100 rounded-lg p-4">
                  <div className="stat-title text-xs">Filas Leídas</div>
                  <div className="stat-value text-2xl text-primary">
                    {uploadResult.rowsRead}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-lg p-4">
                  <div className="stat-title text-xs">Insertadas</div>
                  <div className="stat-value text-2xl text-success">
                    {uploadResult.rowsInserted}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-lg p-4">
                  <div className="stat-title text-xs">Actualizadas</div>
                  <div className="stat-value text-2xl text-info">
                    {uploadResult.rowsUpdated}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-lg p-4">
                  <div className="stat-title text-xs">Inválidas</div>
                  <div className="stat-value text-2xl text-error">
                    {uploadResult.rowsInvalid}
                  </div>
                </div>
              </div>

              {/* Errores de validación */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <details className="collapse collapse-arrow bg-base-100">
                    <summary className="collapse-title font-medium">
                      Ver errores de validación ({uploadResult.errors.length})
                    </summary>
                    <div className="collapse-content">
                      <div className="overflow-x-auto max-h-60">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Fila</th>
                              <th>Errores</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResult.errors.map((err, index) => (
                              <tr key={index}>
                                <td className="font-mono">{err.row}</td>
                                <td>
                                  <ul className="list-disc list-inside text-xs">
                                    {err.errors.map((e, i) => (
                                      <li key={i}>{e}</li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              <div className="mt-4">
                <a href="/" className="btn btn-primary">
                  Ver Dashboard Actualizado
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ejemplo de CSV */}
      <div className="card-executive">
        <h3 className="text-xl font-bold mb-4">Archivo de Ejemplo</h3>
        <p className="mb-4 opacity-70">
          Descarga un archivo CSV de ejemplo para ver el formato correcto:
        </p>
        <a
          href="/sample-data/panel_secretario.csv"
          download
          className="btn btn-outline btn-primary gap-2"
        >
          <DocumentTextIcon className="h-5 w-5" />
          Descargar CSV de Ejemplo
        </a>
      </div>
    </div>
  );
};

export default Carga;
