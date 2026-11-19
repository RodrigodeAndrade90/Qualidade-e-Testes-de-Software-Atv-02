import { test, expect, clearDatabase } from './support';

test.describe('Registro de estudantes — E2E', () => {

  test('ao iniciar, apresenta os estudantes carregados', async ({ page }) => {
    const rows = page.getByTestId('student-row');
    await expect(rows).toHaveCount(3);
    await expect(rows.filter({ hasText: '258001' })).toContainText('Ana Clara Silva');
    await expect(rows.filter({ hasText: '258002' })).toContainText('Bruno Henrique Santos');
    await expect(rows.filter({ hasText: '258003' })).toContainText('Camila Oliveira Souza');
    await expect(page.getByTestId('list-message')).toHaveText('');
  });

  test('sem registros, informa que não há estudantes cadastrados', async ({ page }) => {
    clearDatabase();
    await page.reload();
    await expect(page.getByTestId('student-row')).toHaveCount(0);
    await expect(page.getByTestId('list-message'))
      .toHaveText('Ainda não há estudantes registrados.');
  });

  test('salva um estudante, limpa os campos e atualiza a tabela', async ({ page }) => {
    await page.getByTestId('ra').fill('900001');
    await page.getByTestId('name').fill('João Silva');
    await page.getByTestId('submit').click();

    const msg = page.getByTestId('form-message');
    await expect(msg).toHaveText('Estudante salvo com sucesso.');
    await expect(msg).toHaveAttribute('data-state', 'success');
    await expect(page.getByTestId('ra')).toHaveValue('');
    await expect(page.getByTestId('name')).toHaveValue('');

    const rows = page.getByTestId('student-row');
    await expect(rows).toHaveCount(4);
    await expect(rows.filter({ hasText: '900001' })).toContainText('João Silva');
  });

  test('os dados continuam na tabela depois de recarregar a página', async ({ page }) => {
    await page.getByTestId('ra').fill('900002');
    await page.getByTestId('name').fill('Maria Souza');
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('form-message'))
      .toHaveText('Estudante salvo com sucesso.');

    await page.reload();
    const rows = page.getByTestId('student-row');
    await expect(rows).toHaveCount(4);
    await expect(rows.filter({ hasText: '900002' })).toContainText('Maria Souza');
  });

  test('impede o envio quando RA e nome estão em branco', async ({ page }) => {
    await expect(page.getByTestId('ra')).toHaveAttribute('required', '');
    await expect(page.getByTestId('name')).toHaveAttribute('required', '');
    await page.getByTestId('submit').click();

    await expect(page.getByTestId('form-message'))
      .not.toHaveText('Estudante salvo com sucesso.');
    await expect(page.getByTestId('student-row')).toHaveCount(3);
  });

  test('recusa valores de RA negativos, zerados, decimais ou acima do máximo', async ({ page }) => {
    const ra = page.getByTestId('ra');
    await expect(ra).toHaveAttribute('min', '1');
    await expect(ra).toHaveAttribute('max', '2147483647');
    await expect(ra).toHaveAttribute('step', '1');

    for (const valor of ['-1', '0', '1.5', '2147483648']) {
      await ra.fill(valor);
      await page.getByTestId('name').fill('Nome Válido');
      await page.getByTestId('submit').click();

      await expect(page.getByTestId('form-message'))
        .not.toHaveText('Estudante salvo com sucesso.');
      await expect(page.getByTestId('student-row')).toHaveCount(3);
      const valid = await ra.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(valid).toBe(false);
    }
  });

  test('recusa nomes com menos de três caracteres úteis', async ({ page }) => {
    for (const valor of ['  ab  ', 'a', '   ']) {
      await page.getByTestId('ra').fill('900010');
      const name = page.getByTestId('name');
      await name.fill(valor);
      await page.getByTestId('submit').click();

      await expect(page.getByTestId('form-message'))
        .not.toHaveText('Estudante salvo com sucesso.');
      await expect(page.getByTestId('student-row')).toHaveCount(3);
      const valid = await name.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(valid).toBe(false);
    }
  });

  test('RA já utilizado gera aviso e conserva os valores informados', async ({ page }) => {
    await page.getByTestId('ra').fill('258001');
    await page.getByTestId('name').fill('Nome Duplicado');
    await page.getByTestId('submit').click();

    const msg = page.getByTestId('form-message');
    await expect(msg).toHaveAttribute('data-state', 'error');
    await expect(msg).toContainText('O cadastro do estudante não foi concluído.');
    await expect(msg).toContainText('Já há um estudante registrado com esse RA.');

    await expect(page.getByTestId('ra')).toHaveValue('258001');
    await expect(page.getByTestId('name')).toHaveValue('Nome Duplicado');
    await expect(page.getByTestId('student-row')).toHaveCount(3);
  });
});
