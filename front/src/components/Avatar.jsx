import { initials } from '../utils/format'

const TONES = ['av-1', 'av-2', 'av-3', 'av-4']

const toneFor = (seed = '') => TONES[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TONES.length]

const Avatar = ({ name, seed, large = false, className = '' }) => (
  <span aria-hidden="true" className={`avatar ${toneFor(seed ?? name)} ${large ? 'avatar-lg' : ''} ${className}`}>
    {initials(name)}
  </span>
)

export default Avatar
