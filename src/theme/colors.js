const themes = {
  light: {
    bg:'#F4F7FB', surface:'#FFFFFF', surface2:'#E8EEF6', navy:'#10243E',
    blue:'#1D4ED8', accentButton:'#1D4ED8', accentOn:'#FFFFFF', cyan:'#0E7490', teal:'#0F766E', tealButton:'#0F766E', green:'#157347', successButton:'#157347', dangerButton:'#B42318',
    text:'#14233A', muted:'#52647A', line:'#D6DFEA', red:'#B42318', white:'#FFFFFF',
    onNavyMuted:'#C8D5E4', purple:'#5B4BC4', orange:'#A84708',
    successSurface:'#E8F6EE', warning:'#805500', warningSurface:'#FFF4D6',
    dangerSurface:'#FCE8E8', infoSurface:'#E8F1FF', infoText:'#284F89',
  },
  ocean: {
    bg:'#EAF8F8', surface:'#FFFFFF', surface2:'#DDF2F2', navy:'#0B3845',
    blue:'#086C8A', accentButton:'#086C8A', accentOn:'#FFFFFF', cyan:'#087E8B', teal:'#087E72', tealButton:'#087E72', green:'#13744D', successButton:'#13744D', dangerButton:'#B42318',
    text:'#10303B', muted:'#4D6B72', line:'#BDDDDF', red:'#B42318', white:'#FFFFFF',
    onNavyMuted:'#C5DEE2', purple:'#5B4BC4', orange:'#A84708',
    successSurface:'#E6F7EE', warning:'#805500', warningSurface:'#FFF4D6',
    dangerSurface:'#FCE8E8', infoSurface:'#E7F4FA', infoText:'#14536B',
  },
  lavender: {
    bg:'#25212F', surface:'rgba(255,255,255,0.12)', surface2:'rgba(255,255,255,0.08)', navy:'rgba(44,38,58,0.82)',
    blue:'#D5C9EC', accentButton:'#695A80', accentOn:'#FFFFFF', cyan:'#C2AEDF', teal:'#B9A9D0', tealButton:'#665977', green:'#78C4A0', successButton:'#287653', dangerButton:'#A7384C',
    text:'#F5F1F9', muted:'#C5BDCE', line:'rgba(255,255,255,0.20)', red:'#FF9BAA', white:'#FFFFFF',
    onNavyMuted:'#E7DFF0', purple:'#C7B5E0', orange:'#E0A17A',
    successSurface:'rgba(67,151,105,0.22)', warning:'#FFD27A', warningSurface:'rgba(199,146,58,0.20)',
    dangerSurface:'rgba(186,62,82,0.20)', infoSurface:'rgba(188,167,218,0.16)', infoText:'#E6DCF3',
  },
  dark: {
    bg:'#0B1020', surface:'#121A2B', surface2:'#1B2840', navy:'#070D1A',
    blue:'#92B4FF', accentButton:'#335DA8', accentOn:'#FFFFFF', cyan:'#5CE1D6', teal:'#49C9BA', tealButton:'#0B6B63', green:'#56D9A0', successButton:'#146C4B', dangerButton:'#A92E42',
    text:'#F1F5FC', muted:'#B1BDD0', line:'#2D3B52', red:'#FF8991', white:'#FFFFFF',
    onNavyMuted:'#C3CDDC', purple:'#5B4BC4', orange:'#A84708',
    successSurface:'#123729', warning:'#F7C96A', warningSurface:'#352A17',
    dangerSurface:'#3A1D29', infoSurface:'#192C49', infoText:'#ACCAFF',
  },
};

// Keep a stable object reference because screens and shared components import it directly.
export const colors = { ...themes.light };

export function setColorScheme(scheme) {
  const palette = themes[scheme] || themes.light;
  Object.assign(colors, palette);
}
