/**
 * Página de Carga de Datos
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useState, useEffect } from 'react';
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

const Carga = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Estado para año de carga de CSV
  const [uploadAnio, setUploadAnio] = useState(new Date().getFullYear());
  
  // Estados para metas multi-año
  const [metasPorAnio, setMetasPorAnio] = useState({});
  const [metasLoading, setMetasLoading] = useState(true);
  const [metasSaving, setMetasSaving] = useState({});
  const [metasMessage, setMetasMessage] = useState(null);
  const [nuevoAnio, setNuevoAnio] = useState('');
  const [showAddAnio, setShowAddAnio] = useState(false);

  // Cargar metas al iniciar
  useEffect(() => {
    const loadMetas = async () => {
      try {
        const response = await apiService.getMetas();
        if (response.data.success) {
          setMetasPorAnio(response.data.data);
        }
      } catch (err) {
        console.error('Error cargando metas:', err);
      } finally {
        setMetasLoading(false);
      }
    };
    loadMetas();
  }, []);

  const handleMetaChange = (anio, field, value) => {
    setMetasPorAnio(prev => ({
      ...prev,
      [anio]: {
        ...prev[anio],
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const handleSaveMetasAnio = async (anio) => {
    setMetasSaving(prev => ({ ...prev, [anio]: true }));
    setMetasMessage(null);
    try {
      const response = await apiService.updateMetasAnio(anio, metasPorAnio[anio]);
      if (response.data.success) {
        setMetasMessage({ type: 'success', text: `Metas ${anio} actualizadas correctamente` });
      }
    } catch (err) {
      setMetasMessage({ type: 'error', text: err.response?.data?.error || 'Error al guardar' });
    } finally {
      setMetasSaving(prev => ({ ...prev, [anio]: false }));
    }
  };

  const handleAddAnio = async () => {
    const anio = parseInt(nuevoAnio);
    if (!anio || anio < 2020 || anio > 2050) {
      setMetasMessage({ type: 'error', text: 'Año inválido' });
      return;
    }
    if (metasPorAnio[anio]) {
      setMetasMessage({ type: 'error', text: `El año ${anio} ya existe` });
      return;
    }
    try {
      const defaultMetas = { total: 300, e1: 300, e2: 250, e3: 200, e4: 150, e5: 100, e6: 50 };
      const response = await apiService.addAnio(anio, defaultMetas);
      if (response.data.success) {
        setMetasPorAnio(prev => ({ ...prev, [anio]: defaultMetas }));
        setMetasMessage({ type: 'success', text: `Año ${anio} agregado correctamente` });
        setNuevoAnio('');
        setShowAddAnio(false);
      }
    } catch (err) {
      setMetasMessage({ type: 'error', text: err.response?.data?.error || 'Error al agregar año' });
    }
  };

  const handleDeleteAnio = async (anio) => {
    if (!confirm(`¿Eliminar el año ${anio} y todas sus metas?`)) return;
    try {
      const response = await apiService.deleteAnio(anio);
      if (response.data.success) {
        setMetasPorAnio(prev => {
          const newMetas = { ...prev };
          delete newMetas[anio];
          return newMetas;
        });
        setMetasMessage({ type: 'success', text: `Año ${anio} eliminado correctamente` });
      }
    } catch (err) {
      setMetasMessage({ type: 'error', text: err.response?.data?.error || 'Error al eliminar año' });
    }
  };

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
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    
    setPreviewLoading(true);
    setError(null);
    
    try {
      const response = await apiService.previewCSV(selectedFile);
      if (response.data.success) {
        setPreviewData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar vista previa');
    } finally {
      setPreviewLoading(false);
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

      const response = await apiService.uploadCSV(selectedFile, uploadAnio, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });

      setUploadResult(response.data.data);
      setSelectedFile(null);
      setPreviewData(null);
      
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
        {/* Selector de año para la carga */}
        <div className="flex items-center gap-4 mb-4">
          <span className="font-semibold">Cargar CSV para el año:</span>
          <select
            className="select select-bordered select-sm w-32"
            value={uploadAnio}
            onChange={(e) => setUploadAnio(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

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
                {!previewData ? (
                  <button
                    className="btn btn-primary gap-2"
                    onClick={handlePreview}
                    disabled={previewLoading}
                  >
                    {previewLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Analizando...
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-5 w-5" />
                        Vista Previa
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-success gap-2"
                    onClick={handleUpload}
                    disabled={uploading || previewData.missingColumns?.length > 0}
                  >
                    {uploading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Subiendo... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        Confirmar Carga
                      </>
                    )}
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewData(null);
                  }}
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

      {/* Vista Previa */}
      {previewData && (
        <div className="card-executive bg-base-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <EyeIcon className="h-6 w-6 text-primary" />
            Vista Previa del Archivo
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="stat bg-primary/10 rounded-lg p-4">
              <div className="stat-title text-xs">Total Filas</div>
              <div className="stat-value text-2xl text-primary">
                {previewData.totalRows}
              </div>
            </div>
            <div className="stat bg-secondary/10 rounded-lg p-4">
              <div className="stat-title text-xs">Dependencias</div>
              <div className="stat-value text-2xl text-secondary">
                {previewData.totalDependencias}
              </div>
            </div>
            <div className="stat bg-success/10 rounded-lg p-4">
              <div className="stat-title text-xs">Filas Válidas</div>
              <div className="stat-value text-2xl text-success">
                {previewData.validRows}
              </div>
            </div>
            <div className="stat bg-error/10 rounded-lg p-4">
              <div className="stat-title text-xs">Con Errores</div>
              <div className="stat-value text-2xl text-error">
                {previewData.invalidRows}
              </div>
            </div>
          </div>

          {/* Columnas faltantes */}
          {previewData.missingColumns?.length > 0 && (
            <div className="alert alert-error mb-4">
              <ExclamationCircleIcon className="h-5 w-5" />
              <div>
                <span className="font-bold">Columnas faltantes: </span>
                {previewData.missingColumns.join(', ')}
              </div>
            </div>
          )}

          {/* Dependencias encontradas */}
          <details className="collapse collapse-arrow bg-base-200 mb-4">
            <summary className="collapse-title font-medium">
              Dependencias encontradas ({previewData.dependencias?.length || 0})
            </summary>
            <div className="collapse-content">
              <div className="flex flex-wrap gap-2">
                {previewData.dependencias?.map((dep, i) => (
                  <span key={i} className="badge badge-outline">{dep}</span>
                ))}
              </div>
            </div>
          </details>

          {/* Errores de validación */}
          {previewData.errors?.length > 0 && (
            <details className="collapse collapse-arrow bg-error/10 mb-4">
              <summary className="collapse-title font-medium text-error">
                Ver errores de validación ({previewData.errors.length})
              </summary>
              <div className="collapse-content">
                <div className="overflow-x-auto max-h-40">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Errores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.errors.map((err, index) => (
                        <tr key={index}>
                          <td className="font-mono">{err.row}</td>
                          <td className="text-xs">{err.errors.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          )}

          {/* Muestra de datos */}
          {previewData.preview?.length > 0 && (
            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title font-medium">
                Muestra de datos (primeros {previewData.preview.length} registros)
              </summary>
              <div className="collapse-content overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>Dependencia</th>
                      <th>Trámite</th>
                      <th>Nivel</th>
                      <th>S</th>
                      <th>R</th>
                      <th>E1-E6</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td className="max-w-[120px] truncate">{row.dependencia}</td>
                        <td className="max-w-[180px] truncate">{row.tramite}</td>
                        <td>{row.nivel_digitalizacion}</td>
                        <td>{row.s}</td>
                        <td>{row.r}</td>
                        <td className="font-mono text-xs">
                          {[row.fases?.e1, row.fases?.e2, row.fases?.e3, row.fases?.e4, row.fases?.e5, row.fases?.e6]
                            .map(f => f ? '✓' : '·').join('')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
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

      {/* Configuración de Metas Multi-Año */}
      <div className="card-executive">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Cog6ToothIcon className="h-6 w-6 text-primary" />
            Configurar Metas por Año
          </h3>
          {!showAddAnio ? (
            <button
              className="btn btn-outline btn-sm gap-2"
              onClick={() => setShowAddAnio(true)}
            >
              <PlusCircleIcon className="h-4 w-4" />
              Agregar Año
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input input-bordered input-sm w-24"
                placeholder="Año"
                value={nuevoAnio}
                onChange={(e) => setNuevoAnio(e.target.value)}
                min="2020"
                max="2050"
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddAnio}>
                Agregar
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddAnio(false); setNuevoAnio(''); }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
        <p className="text-sm opacity-70 mb-4">
          Ajusta las metas de cada año. Estas se usan para calcular los porcentajes en el dashboard.
        </p>

        {metasMessage && (
          <div className={`alert ${metasMessage.type === 'success' ? 'alert-success' : 'alert-error'} py-2 mb-4`}>
            {metasMessage.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
            <span className="text-sm">{metasMessage.text}</span>
          </div>
        )}

        {metasLoading ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(metasPorAnio).sort().map((anio) => (
              <div key={anio} className="border rounded-lg p-4 bg-base-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">Metas {anio}</h4>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => handleDeleteAnio(anio)}
                    title="Eliminar año"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text text-xs font-semibold">Total</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      value={metasPorAnio[anio]?.total || 0}
                      onChange={(e) => handleMetaChange(anio, 'total', e.target.value)}
                      min="0"
                    />
                  </div>
                  {['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((etapa) => (
                    <div key={etapa} className="form-control">
                      <label className="label py-0.5">
                        <span className="label-text text-xs">{etapa.toUpperCase()}</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={metasPorAnio[anio]?.[etapa] || 0}
                        onChange={(e) => handleMetaChange(anio, etapa, e.target.value)}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 flex justify-end">
                  <button
                    className={`btn btn-primary btn-sm ${metasSaving[anio] ? 'loading' : ''}`}
                    onClick={() => handleSaveMetasAnio(anio)}
                    disabled={metasSaving[anio]}
                  >
                    {metasSaving[anio] ? 'Guardando...' : `Guardar Metas ${anio}`}
                  </button>
                </div>
              </div>
            ))}

            {Object.keys(metasPorAnio).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay años configurados. Haz clic en "Agregar Año" para comenzar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Carga;
