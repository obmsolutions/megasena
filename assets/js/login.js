// Verifica se há usuários cadastrados no localStorage
        if (!localStorage.getItem('users')) {
            // Cria um usuário admin padrão se não existir
            const defaultUsers = {
                'admin': {
                    password: 'admin123',
                    isAdmin: true,
                    expirationDays: 0 // 0 = nunca expira
                }
            };
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }

        function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            if (!username || !password) {
                errorMessage.textContent = 'Por favor, preencha todos os campos.';
                return;
            }

            const users = JSON.parse(localStorage.getItem('users'));
            
            if (!users[username] || users[username].password !== password) {
                errorMessage.textContent = 'Usuário ou senha incorretos.';
                return;
            }

            // Verifica se a senha expirou
            const user = users[username];
            if (user.expirationDate && new Date(user.expirationDate) < new Date()) {
                errorMessage.textContent = 'Sua senha expirou. Entre em contato com o administrador.';
                return;
            }

            // Login bem-sucedido
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'sistema.html';
        }

        function showAdminLogin() {
            const username = prompt('Digite o usuário administrador:');
            if (!username) return;
            
            const password = prompt('Digite a senha administrador:');
            if (!password) return;

            const users = JSON.parse(localStorage.getItem('users'));
            
            if (!users[username] || users[username].password !== password || !users[username].isAdmin) {
                alert('Acesso negado. Credenciais administrativas inválidas.');
                return;
            }

            // Login admin bem-sucedido - redireciona para o gerenciamento
            sessionStorage.setItem('adminLoggedIn', 'true');
            window.location.href = 'user-management.html';
        }
