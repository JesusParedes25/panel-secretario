/**
 * Panel de Administración
 * Panel Secretario - Gobierno de Hidalgo
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { 
  ArrowUpTrayIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const Admin = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Estados para metas
  const [metas, setMetas] = useState({
    total: 300,
    e1: 300,
    e2: 250,
    e3: 200,
    e4: 150,
    e5: 100,
    e6: 50,
    acciones: 150,
  });
  const [metasLoading, setMetasLoading] = useState(true);
  const [metasSaving, setMetasSaving] = useState(false);
  const [metasMessage, setMetasMessage] = useState(null);

  // Estados para CSV
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  // Cargar metas al iniciar
  useEffect(() => {
    const loadMetas = async () => {
      try {
        const response = await apiService.getMetas();
        if (response.data.success) {
          setMetas(response.data.data);
        }
      } catch (err) {
        console.error('Error cargando metas:', err);
      } finally {
        setMetasLoading(false);
      }
    };
    loadMetas();
  }, []);

  // Verificar autenticación
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!isAdmin()) {
      navigate('/');
    }
  }, [user, navigate, isAdmin]);

  const handleMetaChange = (field, value) => {
    setMetas(prev => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

  const handleSaveMetas = async () => {
    setMetasSaving(true);
    setMetasMessage(null);
    try {
      const response = await apiService.updateMetas(metas);
      if (response.data.success) {
        setMetasMessage({ type: 'success', text: 'Metas actualizadas correctamente' });
      }
    } catch (err) {
      setMetasMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Error al guardar metas' 
      });
    } finally {
      setMetasSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Solo se permiten archivos CSV');
        setSelectedFile(null);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 20MB');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setPreviewData(null);
      setUploadResult(null);
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
    if (!selectedFile) return;
    
    setUploadLoading(true);
    setError(null);
    
    try {
      const response = await apiService.uploadCSVAuth(selectedFile);
      if (response.data.success) {
        setUploadResult(response.data.data);
        setPreviewData(null);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar archivo');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-primary text-primary-content shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.hidalgo.gob.mx/gobierno/images/logos/logo_gob.png" 
                alt="Gobierno del Estado de Hidalgo"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-lg font-bold">Panel de Administración</h1>
                <p className="text-xs opacity-80">Bienvenido, {user.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" className="btn btn-ghost btn-sm">
                Ver Dashboard
              </a>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm gap-2">
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sección de Metas */}
          <div className="card bg-white shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Cog6ToothIcon className="h-6 w-6 text-primary" />
                Configurar Metas 2025
              </h2>
              
              {metasLoading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Total Trámites</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        value={metas.total}
                        onChange={(e) => handleMetaChange('total', e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Acciones (S+R)</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        value={metas.acciones}
                        onChange={(e) => handleMetaChange('acciones', e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="divider text-sm">Metas por Etapa</div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((etapa) => (
                      <div key={etapa} className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-sm">{etapa.toUpperCase()}</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm"
                          value={metas[etapa]}
                          onChange={(e) => handleMetaChange(etapa, e.target.value)}
                          min="0"
                        />
                      </div>
                    ))}
                  </div>

                  {metasMessage && (
                    <div className={`alert ${metasMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                      {metasMessage.type === 'success' ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <ExclamationCircleIcon className="h-5 w-5" />
                      )}
                      <span>{metasMessage.text}</span>
                    </div>
                  )}

                  <button 
                    className={`btn btn-primary w-full ${metasSaving ? 'loading' : ''}`}
                    onClick={handleSaveMetas}
                    disabled={metasSaving}
                  >
                    {metasSaving ? 'Guardando...' : 'Guardar Metas'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sección de Carga CSV */}
          <div className="card bg-white shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <ArrowUpTrayIcon className="h-6 w-6 text-primary" />
                Cargar Datos CSV
              </h2>

              <div className="space-y-4 mt-4">
                {/* Selector de archivo */}
                <div className="form-control">
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="file-input file-input-bordered w-full"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">
                      Máximo 20MB. Solo archivos .csv
                    </span>
                  </label>
                </div>

                {/* Botones de acción */}
                {selectedFile && !previewData && (
                  <button 
                    className={`btn btn-outline btn-primary w-full gap-2 ${previewLoading ? 'loading' : ''}`}
                    onClick={handlePreview}
                    disabled={previewLoading}
                  >
                    <EyeIcon className="h-5 w-5" />
                    {previewLoading ? 'Analizando...' : 'Vista Previa'}
                  </button>
                )}

                {/* Error */}
                {error && (
                  <div className="alert alert-error">
                    <ExclamationCircleIcon className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Vista previa */}
                {previewData && (
                  <div className="bg-base-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-bold text-lg">Vista Previa</h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="stat bg-white rounded-lg p-3">
                        <div className="stat-title text-xs">Filas</div>
                        <div className="stat-value text-xl text-primary">{previewData.totalRows}</div>
                      </div>
                      <div className="stat bg-white rounded-lg p-3">
                        <div className="stat-title text-xs">Dependencias</div>
                        <div className="stat-value text-xl text-secondary">{previewData.totalDependencias}</div>
                      </div>
                      <div className="stat bg-white rounded-lg p-3">
                        <div className="stat-title text-xs">Válidas</div>
                        <div className="stat-value text-xl text-success">{previewData.validRows}</div>
                      </div>
                      <div className="stat bg-white rounded-lg p-3">
                        <div className="stat-title text-xs">Con errores</div>
                        <div className="stat-value text-xl text-error">{previewData.invalidRows}</div>
                      </div>
                    </div>

                    {previewData.missingColumns.length > 0 && (
                      <div className="alert alert-warning text-sm">
                        <ExclamationCircleIcon className="h-5 w-5" />
                        <span>Columnas faltantes: {previewData.missingColumns.join(', ')}</span>
                      </div>
                    )}

                    {previewData.errors.length > 0 && (
                      <details className="collapse collapse-arrow bg-white">
                        <summary className="collapse-title text-sm font-medium">
                          Ver errores ({previewData.errors.length})
                        </summary>
                        <div className="collapse-content text-xs">
                          <ul className="list-disc list-inside space-y-1">
                            {previewData.errors.slice(0, 10).map((err, i) => (
                              <li key={i}>
                                <span className="font-mono">Fila {err.row}:</span> {err.errors.join(', ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )}

                    {/* Muestra de datos */}
                    {previewData.preview.length > 0 && (
                      <details className="collapse collapse-arrow bg-white">
                        <summary className="collapse-title text-sm font-medium">
                          Muestra de datos (primeros {previewData.preview.length})
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
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.preview.slice(0, 5).map((row, i) => (
                                <tr key={i}>
                                  <td className="max-w-[100px] truncate">{row.dependencia}</td>
                                  <td className="max-w-[150px] truncate">{row.tramite}</td>
                                  <td>{row.nivel_digitalizacion}</td>
                                  <td>{row.s}</td>
                                  <td>{row.r}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}

                    <div className="flex gap-2">
                      <button 
                        className="btn btn-ghost flex-1"
                        onClick={() => {
                          setPreviewData(null);
                          setSelectedFile(null);
                          const fileInput = document.getElementById('file-input');
                          if (fileInput) fileInput.value = '';
                        }}
                      >
                        Cancelar
                      </button>
                      <button 
                        className={`btn btn-primary flex-1 gap-2 ${uploadLoading ? 'loading' : ''}`}
                        onClick={handleUpload}
                        disabled={uploadLoading || previewData.missingColumns.length > 0}
                      >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        {uploadLoading ? 'Cargando...' : 'Confirmar Carga'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Resultado de carga */}
                {uploadResult && (
                  <div className="alert alert-success">
                    <CheckCircleIcon className="h-6 w-6" />
                    <div>
                      <div className="font-bold">¡Archivo cargado exitosamente!</div>
                      <div className="text-sm">
                        {uploadResult.rowsInserted} insertados, {uploadResult.rowsUpdated} actualizados
                        {uploadResult.rowsInvalid > 0 && `, ${uploadResult.rowsInvalid} inválidos`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
