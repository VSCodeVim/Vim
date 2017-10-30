import json
package = open('../package.json').read()
package = json.loads(package)
keysToBind = ['space', 'left', 'right', 'up', 'down', 'esc', 'bs', 'tab', 'cr']
vimKeyToVS = {'esc': 'Escape', 'bs': 'backspace', 'cr': 'enter'}
keybindings = []
for key in keysToBind:
    vsKey = key
    if key in vimKeyToVS:
        vsKey = vimKeyToVS[key]
    for modifier in ['ctrl']:
        modKey = '{0}+{1}'.format(modifier, vsKey)
        vimKey = '<{0}-{1}>'.format(modifier[0], key)
        keybind = {'key': modKey,
                   'command': 'vim.{0}'.format(vimKey),
                   'when': 'vim.use_{0}'.format(vimKey),
                   'vimKey': vimKey}
        keybindings.append(keybind)
    if len(key) > 1:
        key = '<{0}>'.format(key)
        keybind = {'key': vsKey, 'command': 'vim.{0}'.format(
            key), 'when': 'vim.use_{0}'.format(key), 'vimKey': key}
        keybindings.append(keybind)

keysToBind = []
for i in range(ord('!'), ord('~') + 1):
    keysToBind.append(chr(i).lower())

keysToBind = list(set(keysToBind))

for key in keysToBind:
    vsKey = key
    if key in vimKeyToVS:
        vsKey = vimKeyToVS[key]
    modifier = 'ctrl'
    modKey = '{0}+{1}'.format(modifier, vsKey)
    vimKey = '<{0}-{1}>'.format(modifier[0], key)
    keybind = {'key': modKey,
               'command': 'vim.{0}'.format(vimKey),
               'when': 'vim.use_{0}'.format(vimKey),
               'vimKey': vimKey}
    keybindings.append(keybind)


package['contributes']['keybindings'] = keybindings
open('../package.json', 'w').write(json.dumps(package, indent=2, sort_keys=False))
# keybind[]
# // let vimToVSMap: {[key: string]: string[]} = {
# // };
# // let vimToVSMap: {[key: string]: string} = {
# // esc: 'escape',
# // };
# for (let i='!'.charCodeAt(0); i <= '~'.charCodeAt(0); i + +) {
#   keysToBind.push(String.fromCharCode(i));}
# for (let key of keysToBind) {
#   for (let modifier of['c', 's']) {
#     const modKey = `${modifier} -${key}`;
