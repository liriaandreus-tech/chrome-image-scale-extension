# Image Scale Viewer

Extensão para Google Chrome que mostra as dimensões e a proporção de uma imagem pelo menu do botão direito.

## Instalação

1. Abra `chrome://extensions` no Chrome e ative o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e escolha a pasta `chrome-image-scale-extension`.
3. Ao atualizar a extensão, clique em **Recarregar** no cartão da extensão e atualize as páginas abertas.

Para usar em arquivos locais, habilite **Permitir acesso a URLs de arquivo** nos detalhes da extensão.

## Uso

Clique com o botão direito em uma imagem e escolha **Ver escala da imagem**. O painel exibe dimensões naturais, proporção, tamanho da caixa na página e escalas horizontal e vertical. Os botões copiam as dimensões ou a proporção.

Clique fora do painel, pressione **Esc** ou clique em **×** para removê-lo. Ao clicar em outra imagem, o painel anterior é substituído.

## Como interpretar as medidas

- **Dimensões naturais** são as informadas pelo navegador para a imagem carregada. Podem ser ajustadas por densidade e diferir dos pixels do arquivo original em imagens responsivas.
- **Proporção** é a relação exata entre largura e altura informadas pelo navegador. Por exemplo, 1920 × 1080 resulta em 16:9.
- **Tamanho na página** é a caixa CSS do elemento, em pixels CSS. Ela pode incluir bordas e não representa necessariamente o conteúdo visível quando há recorte, transformação ou `object-fit`.
- **Escala** compara a caixa CSS com as dimensões naturais. Ela não é a configuração de zoom do navegador.
- **Formato** é uma indicação baseada na extensão do endereço, que pode ser ausente ou diferente do formato real.

Se não for possível identificar com segurança a imagem clicada, o painel informa que as dimensões estão indisponíveis. O Chrome impede o funcionamento em suas páginas internas e na Chrome Web Store. Alguns quadros incorporados, imagens em canvas e sites com proteção específica podem impedir a leitura ou a exibição do painel. Em páginas abertas antes da instalação, atualize a aba para garantir que a imagem clicada possa ser identificada.

## Privacidade e permissões

A extensão processa os dados localmente e não transmite as informações para um servidor próprio. O painel mostra uma parte da URL da imagem. Ela pode conter informações privadas fornecidas pelo site.

A permissão `contextMenus` adiciona o comando. `scripting` permite iniciar o script em uma aba aberta antes da instalação, e `activeTab` concede acesso temporário à aba acionada. O acesso a sites e o script em todos os quadros permitem identificar a imagem no momento do clique, inclusive quando há várias imagens com o mesmo endereço e quando ela está em um quadro incorporado.

Ao fechar, o painel e os dados exibidos são removidos da página. O navegador ainda pode manter o script leve da extensão carregado nas páginas e iniciar ou suspender seu processo de fundo conforme necessário.

## Arquivos

- `manifest.json` define a extensão e as permissões.
- `background.js` gerencia o menu e a comunicação entre quadros.
- `content.js` identifica a imagem e cria o painel.
- `content.css` contém os estilos.
- `icons/` contém os ícones.

## Licença

Distribuído sob a licença MIT. Consulte o arquivo LICENSE.
