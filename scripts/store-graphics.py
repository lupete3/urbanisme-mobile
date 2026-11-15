import os, sys
from PIL import Image, ImageDraw, ImageFont
root = sys.argv[1]
out = os.path.join(root, 'store'); os.makedirs(out, exist_ok=True)
logo = Image.open(os.path.join(root, 'www/assets/logo.png')).convert('RGBA')
# fond blanc -> transparent pour composer proprement
px = logo.load()
for y in range(logo.height):
    for x in range(logo.width):
        r, g, b, a = px[x, y]
        if r > 245 and g > 245 and b > 245: px[x, y] = (255, 255, 255, 0)
picto = logo.crop((0, 0, logo.width, 280)); picto = picto.crop(picto.getbbox())
full = logo.crop(logo.getbbox())
BLUE = (13, 52, 102); GREEN = (46, 139, 69)

# Icône 512x512 (PNG 32 bits, pas de transparence exigée : fond blanc)
ic = Image.new('RGBA', (512, 512), (255, 255, 255, 255))
s = 360 / max(picto.size); p = picto.resize((round(picto.width*s), round(picto.height*s)), Image.LANCZOS)
ic.alpha_composite(p, ((512-p.width)//2, (512-p.height)//2))
ic.convert('RGB').save(os.path.join(out, 'icone-512.png'))

# Bannière 1024x500
bn = Image.new('RGBA', (1024, 500), (255, 255, 255, 255))
d = ImageDraw.Draw(bn)
d.rectangle((0, 470, 1024, 500), fill=BLUE); d.rectangle((0, 462, 1024, 470), fill=GREEN)
s = 330 / full.width; f2 = full.resize((round(full.width*s), round(full.height*s)), Image.LANCZOS)
bn.alpha_composite(f2, (60, (462-f2.height)//2))
fb = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 46)
fr = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 30)
x = 450
d.text((x, 120), 'Votre dossier', font=fb, fill=BLUE)
d.text((x, 175), "d'urbanisme, simplement.", font=fb, fill=BLUE)
for i, t in enumerate(['Déclaration préalable', "Enseigne (AP)  •  Permis de démolir", 'Plans annotés et PDF prêt à déposer']):
    yy=262+i*44+22; d.line([(x+2,yy),(x+10,yy+8),(x+24,yy-8)], fill=GREEN, width=5, joint='curve'); d.text((x+34, 262 + i*44), t, font=fr, fill=(40, 40, 40))
bn.convert('RGB').save(os.path.join(out, 'banniere-1024x500.png'))
print('ok')
