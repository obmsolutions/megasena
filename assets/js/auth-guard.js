// Verifica se o usuário está logado
        if (!sessionStorage.getItem('loggedInUser')) {
            window.location.href = 'index.html'; // ou 'index.html' se preferir
        }

        // Adiciona botão de logout quando o DOM estiver carregado
        document.addEventListener('DOMContentLoaded', function() {
            const tabsDiv = document.querySelector('.tabs');
            if (tabsDiv) {
                const logoutBtn = document.createElement('div');
                logoutBtn.className = 'tab';
                logoutBtn.textContent = 'Sair';
                logoutBtn.style.marginLeft = 'auto';
                logoutBtn.style.backgroundColor = '#d32f2f';
                logoutBtn.style.color = 'white';
                logoutBtn.onclick = function() {
                    sessionStorage.removeItem('loggedInUser');
                    // Redireciona imediatamente para a página de login ou index
                    window.location.href = 'index.html'; // ou 'index.html' se preferir
                };
                tabsDiv.appendChild(logoutBtn);
            }
        });
