"""
Descarga de la Consulta Amigable del MEF el presupuesto del Gobierno Nacional por sector,
el total nacional y cada uno de los 25 departamentos, y lo guarda en data/data.xlsx.

Uso, desde la carpeta dashboard:
    python data/scrapear_mef.py          (año actual)
    python data/scrapear_mef.py 2025     (otro año)
Después:
    python data/actualizar_data.py       (convierte data.xlsx en data/data.js)
y sube los cambios a git.

Hojas que genera en data.xlsx:
  Ranking            Sector | PIM | Devengado | Avance %             total del Gobierno Nacional
  Ranking regiones   Código | Departamento | Sector | PIM | Devengado | Avance %
  Info               fuente, año, fecha de descarga y direcciones consultadas

"Departamento" es el lugar donde se ubica la meta del gasto (botón Departamento de la
Consulta Amigable), no la oficina que lo ejecuta. La suma de los departamentos da el total nacional.

Necesita openpyxl:  pip install openpyxl
Tarda 1 a 2 minutos: hace 26 consultas con pausas, porque el sitio tiene protección contra robots.
"""
import datetime
import html
import os
import re
import sys
import time
import urllib.request

try:
    import openpyxl
    from openpyxl.styles import Alignment, Font, PatternFill
except ImportError:
    sys.exit('Falta openpyxl. Instálalo con: pip install openpyxl')

AQUI = os.path.dirname(os.path.abspath(__file__))
XLSX = os.path.join(AQUI, 'data.xlsx')
BASE = 'https://apps5.mineco.gob.pe/transparencia/Navegador/Navegar_7.aspx'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
PAUSA = 2.5  # segundos entre consultas

DEPARTAMENTOS = [
    ('01', 'Amazonas'), ('02', 'Áncash'), ('03', 'Apurímac'), ('04', 'Arequipa'), ('05', 'Ayacucho'),
    ('06', 'Cajamarca'), ('07', 'Callao'), ('08', 'Cusco'), ('09', 'Huancavelica'), ('10', 'Huánuco'),
    ('11', 'Ica'), ('12', 'Junín'), ('13', 'La Libertad'), ('14', 'Lambayeque'), ('15', 'Lima'),
    ('16', 'Loreto'), ('17', 'Madre de Dios'), ('18', 'Moquegua'), ('19', 'Pasco'), ('20', 'Piura'),
    ('21', 'Puno'), ('22', 'San Martín'), ('23', 'Tacna'), ('24', 'Tumbes'), ('25', 'Ucayali'),
]


def direccion(anio, depto=None):
    """Ruta de la Consulta Amigable: [departamento] > Nivel de gobierno E (Nacional) > Sector."""
    return (BASE + '?_uhc=yes&0=' + ('&21=' + depto if depto else '') +
            '&1=E&2=&y=' + str(anio) + '&cpage=1&psize=400')


def descargar(url, intentos=3):
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'es-PE,es;q=0.9'})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode('utf-8', 'replace')
        except Exception as e:  # red caída o bloqueo temporal: reintenta con espera creciente
            if i == intentos - 1:
                raise RuntimeError('No se pudo descargar ' + url + ' · ' + repr(e))
            time.sleep(10 * (i + 1))


def numero(texto):
    t = texto.replace(',', '').strip()
    return float(t) if t not in ('', '-') else 0.0


def leer_cuadro(pagina):
    """Filas del cuadro. Columnas del MEF: nombre, PIA, PIM, Certificación, Compromiso anual,
    Atención de compromiso mensual, Devengado, Girado, Avance %."""
    filas = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', pagina, re.S):
        if 'name="grp1"' not in tr:
            continue
        celdas = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', c))).strip()
                  for c in re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)]
        celdas = [c for c in celdas if c]
        if len(celdas) < 9 or ':' not in celdas[0]:
            continue
        pim, dev, av = numero(celdas[2]), numero(celdas[6]), numero(celdas[8])
        if pim > 0 and abs(dev / pim * 100 - av) > 0.2:
            raise RuntimeError('Las columnas del cuadro cambiaron (devengado ÷ PIM no coincide con el avance en "' + celdas[0] + '"). Revisar el script.')
        filas.append({'sector': celdas[0], 'pim': round(pim), 'devengado': round(dev), 'avance': av / 100})
    return filas


def guardar(anio, nacional, regiones, descargado):
    wb = openpyxl.Workbook()
    cab = Font(bold=True, color='FFFFFF')
    fondo = PatternFill('solid', fgColor='1F4E8C')

    def hoja(ws, encabezados, anchos):
        ws.append(encabezados)
        for i, ancho in enumerate(anchos):
            ws.column_dimensions[openpyxl.utils.get_column_letter(i + 1)].width = ancho
            ws.cell(row=1, column=i + 1).font = cab
            ws.cell(row=1, column=i + 1).fill = fondo
            ws.cell(row=1, column=i + 1).alignment = Alignment(vertical='center')
        ws.freeze_panes = 'A2'

    ws = wb.active
    ws.title = 'Ranking'
    hoja(ws, ['Sector', 'PIM', 'Devengado', 'Avance %'], [52, 18, 18, 11])
    for f in nacional:
        ws.append([f['sector'], f['pim'], f['devengado'], f['avance']])

    ws2 = wb.create_sheet('Ranking regiones')
    hoja(ws2, ['Código', 'Departamento', 'Sector', 'PIM', 'Devengado', 'Avance %'], [9, 16, 52, 18, 18, 11])
    for cod, nombre, filas in regiones:
        for f in filas:
            ws2.append([cod, nombre, f['sector'], f['pim'], f['devengado'], f['avance']])

    for w, c_pim, c_av in [(ws, 2, 4), (ws2, 4, 6)]:
        for fila in w.iter_rows(min_row=2):
            fila[c_pim - 1].number_format = '#,##0'
            fila[c_pim].number_format = '#,##0'
            fila[c_av - 1].number_format = '0.0%'

    ws3 = wb.create_sheet('Info')
    hoja(ws3, ['Dato', 'Valor'], [22, 110])
    for fila in [
        ['Fuente', 'MEF · Consulta Amigable (Consulta de Ejecución del Gasto)'],
        ['Nivel de gobierno', 'E: Gobierno Nacional, por sector'],
        ['Año', anio],
        ['Descargado', descargado],
        ['Departamento', 'Lugar donde se ubica la meta del gasto (no la oficina ejecutora)'],
        ['Dirección nacional', direccion(anio)],
        ['Dirección por región', direccion(anio, 'XX') + '   (XX = código de departamento)'],
    ]:
        ws3.append(fila)

    tmp = XLSX + '.tmp.xlsx'
    wb.save(tmp)
    try:
        os.replace(tmp, XLSX)
    except PermissionError:
        os.remove(tmp)
        sys.exit('No se pudo reemplazar data.xlsx: ciérralo en Excel y vuelve a correr el script.')


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(errors='replace')  # tildes seguras en la consola de Windows
    anio = int(sys.argv[1]) if len(sys.argv) > 1 else datetime.date.today().year
    print('Consulta Amigable · Gobierno Nacional por sector ·', anio)

    nacional = leer_cuadro(descargar(direccion(anio)))
    if len(nacional) < 10:
        sys.exit('El cuadro nacional trajo ' + str(len(nacional)) + ' sectores: la página pudo cambiar o bloquear la consulta. No se modificó data.xlsx.')
    print('  Nacional:', len(nacional), 'sectores')

    regiones = []
    for cod, nombre in DEPARTAMENTOS:
        time.sleep(PAUSA)
        filas = leer_cuadro(descargar(direccion(anio, cod)))
        regiones.append((cod, nombre, filas))
        print('  ' + cod + ' ' + nombre + ':', len(filas), 'sectores')

    # control: la suma de los departamentos debería dar el total nacional
    total = {}
    for _, _, filas in regiones:
        for f in filas:
            total[f['sector']] = total.get(f['sector'], 0) + f['pim']
    difieren = [f['sector'] for f in nacional if f['pim'] and abs(total.get(f['sector'], 0) - f['pim']) / f['pim'] > 0.005]
    if difieren:
        print('  Aviso: en', len(difieren), 'sectores la suma de regiones no llega al total nacional (parte del gasto puede estar en el exterior):', ', '.join(difieren))
    else:
        print('  Control: la suma de las regiones da el total nacional en todos los sectores.')

    descargado = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    guardar(anio, nacional, regiones, descargado)
    print('data.xlsx generado (' + descargado + '). Ahora corre: python data/actualizar_data.py')


if __name__ == '__main__':
    main()
