import { QRCodeSVG } from 'qrcode.react'
import Icon from '../components/Icon'

export default function SettingsPage({ session, onLogout, onVerApresentacao }) {
  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <header className="settings-heading">
        <h1 id="settings-title">Ajustes</h1>
      </header>
      <section className="settings-account" aria-label="Conta">
        <div className="settings-account-icon"><Icon name="settings" size={23} /></div>
        <div className="settings-account-info">
          <span>Conta conectada</span>
          <strong>{session.usuario.email}</strong>
        </div>
        <button
          className="settings-logout"
          type="button"
          aria-label="Sair da conta"
          title="Sair da conta"
          onClick={onLogout}
        >
          <Icon name="logout" size={19} />
        </button>
      </section>
      <section className="settings-presentation" aria-labelledby="settings-presentation-title">
        <div className="settings-account-icon"><Icon name="eye" size={23} /></div>
        <div className="settings-account-info">
          <span id="settings-presentation-title">Apresentação</span>
          <strong>Conheça o projeto de novo</strong>
        </div>
        <button
          className="settings-presentation-link"
          type="button"
          onClick={onVerApresentacao}
        >
          Ver
          <Icon name="chevronRight" size={17} />
        </button>
      </section>
      <section className="settings-qr-section" aria-labelledby="settings-qr-title">
        <h2 id="settings-qr-title">Acessar projeto</h2>
        <div className="settings-qr-code">
          <QRCodeSVG
            value={window.location.origin}
            size={200}
            level="M"
            marginSize={2}
            title="QR code para acessar o projeto"
          />
        </div>
        <a className="settings-project-url" href={window.location.origin}>
          {window.location.origin}
        </a>
      </section>
    </section>
  )
}
