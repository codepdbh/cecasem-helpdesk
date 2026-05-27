import { useEffect, useState, type FormEvent } from 'react';
import { Camera, CheckCircle2, ChevronDown, Download, Paperclip, Send, UserRound, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Alert, Avatar, Badge, Button, Empty, Field, Input, PageTitle, Select, Textarea, formatDate, roleLabel } from '../../components/ui';
import { api, dataOf, downloadFile, errorMessage, fileUrl } from '../../lib/api';
import { liveConnection } from '../../lib/live';
import type { Paged, Ticket, User } from '../../types';

export function TicketDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const admin = user?.role === 'SUPERADMIN';
  const [ticket, setTicket] = useState<Ticket>();
  const [admins, setAdmins] = useState<User[]>([]);
  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState<File>();
  const [constancy, setConstancy] = useState<File>();
  const [constancyDescription, setConstancyDescription] = useState('');
  const [closeComment, setCloseComment] = useState('');
  const [closePhoto, setClosePhoto] = useState<File>();
  const [reopenReason, setReopenReason] = useState('');
  const [status, setStatus] = useState('');
  const [showConstancyForm, setShowConstancyForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => setTicket(dataOf<Ticket>(await api.get(`/tickets/${id}`)));

  useEffect(() => {
    load().catch((requestError) => setError(errorMessage(requestError)));
    if (admin) {
      api.get('/users?limit=100').then((response) => {
        setAdmins(dataOf<Paged<User>>(response).items.filter((candidate) => candidate.role === 'SUPERADMIN' && candidate.isActive));
      });
    }
  }, [id, admin]);

  useEffect(() => {
    const socket = liveConnection();
    const refresh = (event: { ticketId: string }) => {
      if (event.ticketId === id) load().catch((requestError) => setError(errorMessage(requestError)));
    };
    socket?.on('ticket.updated', refresh);
    return () => { socket?.off('ticket.updated', refresh); };
  }, [id]);

  const done = async (success: string) => {
    setMessage(success);
    setError('');
    await load();
  };

  const failure = (requestError: unknown) => {
    setMessage('');
    setError(errorMessage(requestError));
  };

  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post(`/tickets/${id}/comments`, { comment });
      setComment('');
      await done('Comentario registrado.');
    } catch (requestError) { failure(requestError); }
  };

  const addAttachment = async () => {
    if (!attachment) return;
    const payload = new FormData();
    payload.append('attachment', attachment);
    try {
      await api.post(`/tickets/${id}/attachments`, payload);
      setAttachment(undefined);
      await done('Archivo adjunto registrado.');
    } catch (requestError) { failure(requestError); }
  };

  const addConstancy = async () => {
    if (!constancy) return;
    const payload = new FormData();
    payload.append('photo', constancy);
    payload.append('description', constancyDescription);
    try {
      await api.post(`/tickets/${id}/constancy-photos`, payload);
      setConstancy(undefined);
      setConstancyDescription('');
      setShowConstancyForm(false);
      await done('Foto de constancia registrada.');
    } catch (requestError) { failure(requestError); }
  };

  const changeStatus = async () => {
    if (!status) return;
    try {
      await api.patch(`/tickets/${id}/status`, { status });
      setStatus('');
      await done('Estado actualizado.');
    } catch (requestError) { failure(requestError); }
  };

  const assign = async (assignedToId: string) => {
    if (!assignedToId) return;
    try {
      await api.patch(`/tickets/${id}/assign`, { assignedToId });
      await done('El responsable fue asignado y el usuario ha sido notificado.');
    } catch (requestError) { failure(requestError); }
  };

  const resolve = async () => {
    if (!window.confirm('¿Confirmas que el ticket fue resuelto?')) return;
    try {
      await api.patch(`/tickets/${id}/resolve`, new FormData());
      await done('Ticket marcado como resuelto.');
    } catch (requestError) { failure(requestError); }
  };

  const close = async () => {
    if (!closeComment.trim()) {
      setError('Escribe el comentario de cierre.');
      return;
    }
    if (!window.confirm('¿Confirmas el cierre definitivo del ticket?')) return;
    const payload = new FormData();
    payload.append('closeComment', closeComment);
    if (closePhoto) payload.append('constancyPhoto', closePhoto);
    try {
      await api.patch(`/tickets/${id}/close`, payload);
      setShowCloseForm(false);
      setCloseComment('');
      setClosePhoto(undefined);
      await done('Ticket cerrado correctamente.');
    } catch (requestError) { failure(requestError); }
  };

  const reopen = async () => {
    if (!reopenReason.trim()) {
      setError('Ingresa el motivo de reapertura.');
      return;
    }
    try {
      await api.patch(`/tickets/${id}/reopen`, { reason: reopenReason });
      setReopenReason('');
      await done('Ticket reabierto y notificado.');
    } catch (requestError) { failure(requestError); }
  };

  const cancel = async () => {
    if (!window.confirm('¿Confirmas la cancelación del ticket?')) return;
    try {
      await api.patch(`/tickets/${id}/cancel`);
      await done('Ticket cancelado.');
    } catch (requestError) { failure(requestError); }
  };

  if (!ticket) return <div>{error ? <Alert>{error}</Alert> : 'Cargando ticket...'}</div>;

  const finalized = ticket.status === 'CERRADO' || ticket.status === 'CANCELADO';
  const resolved = ticket.status === 'RESUELTO';
  const attendedLabel = ticket.status === 'CERRADO' ? 'Su solicitud fue atendida por:' : 'Usted está siendo atendido por:';

  return (
    <>
      <PageTitle title={`${ticket.code} - ${ticket.title}`} subtitle={`Creado ${formatDate(ticket.createdAt)}`} />
      <div className="mb-5 space-y-3">
        {error && <Alert>{error}</Alert>}
        {message && <Alert kind="success">{message}</Alert>}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <section className="panel">
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge value={ticket.status} />
              <Badge value={ticket.priority} />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{ticket.category.name}</span>
            </div>
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Avatar path={ticket.createdBy.profilePhotoPath} name={ticket.createdBy.fullName} />
              <div><p className="font-semibold">{ticket.createdBy.fullName}</p><p className="text-xs text-slate-500">{ticket.createdBy.username}</p></div>
              {admin && <div className="ml-auto text-right text-xs text-slate-500"><p>IP: {ticket.createdFromIp}</p><p className="max-w-48 truncate">{ticket.createdUserAgent}</p></div>}
            </div>
            {!admin && ticket.assignedTo && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <Avatar path={ticket.assignedTo.profilePhotoPath} name={ticket.assignedTo.fullName} />
                <div>
                  <p className="text-xs font-medium text-blue-700">{attendedLabel}</p>
                  <p className="font-semibold text-cecasem-navy">{ticket.assignedTo.fullName}</p>
                  <p className="text-xs text-slate-500">Equipo de Sistemas</p>
                </div>
              </div>
            )}
            {!admin && !ticket.assignedTo && !finalized && (
              <Alert kind="info">Su solicitud está registrada y pendiente de asignación por el Equipo de Sistemas.</Alert>
            )}
            <div className="mt-5">
              <Detail label="Justificación de prioridad" text={ticket.priorityJustification} />
              <Detail label="¿Por qué se solicita?" text={ticket.reason} />
              <Detail label="¿Para qué propósito se necesita?" text={ticket.purpose} />
              <Detail label="Descripción detallada" text={ticket.description} />
              {ticket.closeComment && <Detail label="Comentario de cierre" text={ticket.closeComment} />}
            </div>
          </section>

          <section className="panel">
            <h2 className="mb-4 font-semibold text-cecasem-navy">Archivos adjuntos</h2>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Input type="file" className="max-w-sm" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" onChange={(event) => setAttachment(event.target.files?.[0])} />
              <Button variant="secondary" type="button" onClick={addAttachment} disabled={!attachment}><Paperclip size={15} className="mr-1 inline" />Adjuntar</Button>
            </div>
            {!ticket.attachments.length ? <Empty text="Sin archivos adjuntos." /> : ticket.attachments.map((item) => (
              <button key={item.id} onClick={() => downloadFile(`/attachments/${item.id}/download`, item.originalName)} className="mb-2 flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-sm hover:bg-slate-100">
                {item.originalName}<Download size={16} />
              </button>
            ))}
          </section>

          <section className="panel">
            <h2 className="mb-4 font-semibold text-cecasem-navy">Conversación</h2>
            <div className="mb-5 space-y-4">
              {!ticket.comments.length && <Empty text="Aún no hay comentarios." />}
              {ticket.comments.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-xl bg-slate-50 p-4">
                  <Avatar size="sm" name={item.user.fullName} path={item.user.profilePhotoPath} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm"><strong>{item.user.fullName}</strong><span className="text-xs text-slate-500">{roleLabel(item.user.role)} · {formatDate(item.createdAt)}</span></div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{item.comment}</p>
                    {admin && <p className="mt-2 text-xs text-slate-400">IP: {item.createdFromIp}</p>}
                  </div>
                </div>
              ))}
            </div>
            <form className="flex items-end gap-3" onSubmit={addComment}>
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Escribe una respuesta..." required className="min-h-20" />
              <Button aria-label="Enviar comentario"><Send size={18} /></Button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel">
            <h2 className="mb-4 font-semibold text-cecasem-navy">Fotos de constancia</h2>
            {ticket.constancyPhotos.map((photo) => (
              <div key={photo.id} className="mb-4 overflow-hidden rounded-xl border border-slate-100">
                <img src={fileUrl(photo.filePath)} alt={photo.originalName} className="h-36 w-full object-cover" />
                <div className="p-3 text-xs text-slate-500">{photo.description || 'Evidencia de atención'}<br />{formatDate(photo.createdAt)}{admin && <><br />IP: {photo.uploadedFromIp}</>}</div>
              </div>
            ))}
            {!ticket.constancyPhotos.length && <p className="mb-4 text-sm text-slate-500">Sin foto de constancia registrada.</p>}
            {admin && !showConstancyForm && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowConstancyForm(true)}>
                <Camera className="mr-1 inline" size={16} />Agregar constancia
              </Button>
            )}
            {admin && showConstancyForm && (
              <div className="rounded-xl bg-slate-50 p-3">
                <Field label="Foto"><Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => setConstancy(event.target.files?.[0])} /></Field>
                <Input className="mt-2" placeholder="Descripción opcional" value={constancyDescription} onChange={(event) => setConstancyDescription(event.target.value)} />
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={addConstancy} disabled={!constancy}><Camera className="mr-1 inline" size={16} />Subir</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowConstancyForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </section>

          {admin && finalized && (
            <section className="panel">
              <div className="flex items-start gap-3">
                {ticket.status === 'CERRADO'
                  ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={22} />
                  : <XCircle className="mt-0.5 shrink-0 text-slate-500" size={22} />}
                <div>
                  <h2 className="font-semibold text-cecasem-navy">{ticket.status === 'CERRADO' ? 'Atención finalizada' : 'Ticket cancelado'}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.status === 'CERRADO'
                      ? 'Este ticket ya fue cerrado. No hay acciones pendientes.'
                      : 'Este ticket fue cancelado y ya no admite cambios de atención.'}
                  </p>
                  {ticket.assignedTo && <p className="mt-3 text-sm"><span className="text-slate-500">Responsable: </span><strong>{ticket.assignedTo.fullName}</strong></p>}
                </div>
              </div>
            </section>
          )}

          {admin && !finalized && (
            <section className="panel space-y-4">
              <h2 className="font-semibold text-cecasem-navy">Atención del ticket</h2>
              <Field label="Responsable del Equipo de Sistemas">
                <Select value={ticket.assignedTo?.id || ''} onChange={(event) => assign(event.target.value)}>
                  <option value="">Seleccionar responsable...</option>
                  {admins.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
                </Select>
              </Field>
              {ticket.assignedTo && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-cecasem-navy">
                  <UserRound size={16} className="shrink-0 text-cecasem-blue" />Asignado a <strong>{ticket.assignedTo.fullName}</strong>
                </div>
              )}
              {!resolved && <Button type="button" variant="secondary" className="w-full" onClick={resolve}>Marcar como resuelto</Button>}
              {resolved && <Alert kind="success">La atención fue marcada como resuelta. Puede cerrar el ticket cuando corresponda.</Alert>}
              {!showCloseForm ? (
                <Button type="button" className="w-full" onClick={() => setShowCloseForm(true)}>Cerrar ticket</Button>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <Field label="Comentario de cierre" required><Textarea value={closeComment} onChange={(event) => setCloseComment(event.target.value)} /></Field>
                  <Field label="Constancia opcional"><Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => setClosePhoto(event.target.files?.[0])} /></Field>
                  <div className="flex gap-2">
                    <Button type="button" className="flex-1" onClick={close}>Confirmar cierre</Button>
                    <Button type="button" variant="ghost" onClick={() => setShowCloseForm(false)}>Volver</Button>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => setShowMoreActions((shown) => !shown)} className="flex w-full items-center justify-between border-t border-slate-100 pt-3 text-sm font-medium text-slate-500">
                Otras acciones <ChevronDown size={16} className={showMoreActions ? 'rotate-180 transition' : 'transition'} />
              </button>
              {showMoreActions && (
                <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex gap-2">
                    <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                      <option value="">Cambiar estado...</option>
                      {['ABIERTO', 'EN_PROCESO', 'ESPERANDO_USUARIO', 'REABIERTO'].filter((item) => item !== ticket.status).map((item) => <option key={item}>{item}</option>)}
                    </Select>
                    <Button type="button" onClick={changeStatus} disabled={!status}>Aplicar</Button>
                  </div>
                  <Button type="button" variant="danger" className="w-full" onClick={cancel}>Cancelar ticket</Button>
                </div>
              )}
            </section>
          )}

          {!admin && (ticket.status === 'CERRADO' || ticket.status === 'RESUELTO') && (
            <section className="panel">
              <h2 className="mb-3 font-semibold text-cecasem-navy">¿El problema continúa?</h2>
              <Field label="Motivo de reapertura" required><Textarea value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} /></Field>
              <Button type="button" className="mt-3 w-full" onClick={reopen}>Solicitar reapertura</Button>
            </section>
          )}

          {admin && (
            <section className="panel">
              <h2 className="mb-4 font-semibold text-cecasem-navy">Historial</h2>
              {!ticket.logs.length ? <Empty text="Sin acciones registradas." /> : ticket.logs.map((log) => (
                <div key={log.id} className="border-l-2 border-cecasem-mist pb-4 pl-3 text-xs">
                  <p className="font-semibold text-slate-700">{log.action.replaceAll('_', ' ')}</p>
                  <p className="text-slate-500">{formatDate(log.createdAt)} {log.user?.fullName && `· ${log.user.fullName}`}</p>
                  {log.ipAddress && <p className="text-slate-400">IP: {log.ipAddress}</p>}
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  return <div className="mb-5"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="whitespace-pre-wrap text-sm">{text}</p></div>;
}
