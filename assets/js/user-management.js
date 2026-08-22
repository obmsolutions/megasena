// Verificação de login admin no início do script
(function() {
    // Verifica se o admin está logado
    if (!sessionStorage.getItem('adminLoggedIn')) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verifica se o usuário admin ainda existe
    const users = JSON.parse(localStorage.getItem('users')) || {};
    let adminExists = false;
    
    for (const username in users) {
        if (users[username].isAdmin) {
            adminExists = true;
            break;
        }
    }
    
    if (!adminExists) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }
})();
        // Verifica se o admin está logado
        if (!sessionStorage.getItem('adminLoggedIn')) {
            window.location.href = 'index.html';
        }

        // Carrega os usuários ao carregar a página
        document.addEventListener('DOMContentLoaded', loadUsers);

        function loadUsers() {
            const users = JSON.parse(localStorage.getItem('users')) || {};
            const userSelect = document.getElementById('changeUser');
            const tableBody = document.querySelector('#usersTable tbody');
            
            // Limpa os selects e a tabela
            userSelect.innerHTML = '';
            tableBody.innerHTML = '';
            
            // Preenche o select de usuários
            for (const username in users) {
                const option = document.createElement('option');
                option.value = username;
                option.textContent = username;
                userSelect.appendChild(option);
            }
            
            // Preenche a tabela de usuários
            for (const username in users) {
                const user = users[username];
                const row = document.createElement('tr');
                
                // Nome de usuário
                const usernameCell = document.createElement('td');
                usernameCell.textContent = username;
                row.appendChild(usernameCell);
                
                // Tipo (Admin/Comum)
                const typeCell = document.createElement('td');
                typeCell.textContent = user.isAdmin ? 'Administrador' : 'Usuário Comum';
                row.appendChild(typeCell);
                
                // Data de expiração
                const expirationCell = document.createElement('td');
                if (user.expirationDate) {
                    const expirationDate = new Date(user.expirationDate);
                    expirationCell.textContent = expirationDate.toLocaleDateString();
                    
                    // Verifica se a senha expirou
                    if (expirationDate < new Date()) {
                        expirationCell.textContent += ' (Expirada)';
                        expirationCell.style.color = '#d32f2f';
                    }
                } else {
                    expirationCell.textContent = 'Nunca';
                }
                row.appendChild(expirationCell);
                
                // Ações
                const actionsCell = document.createElement('td');
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Excluir';
                deleteBtn.onclick = () => deleteUser(username);
                deleteBtn.style.backgroundColor = '#d32f2f';
                deleteBtn.style.marginRight = '5px';
                deleteBtn.onmouseover = () => deleteBtn.style.backgroundColor = '#b71c1c';
                deleteBtn.onmouseout = () => deleteBtn.style.backgroundColor = '#d32f2f';
                
                actionsCell.appendChild(deleteBtn);
                row.appendChild(actionsCell);
                
                tableBody.appendChild(row);
            }
        }

        function addUser() {
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const expirationDays = parseInt(document.getElementById('expirationDays').value);
            const isAdmin = document.getElementById('isAdmin').checked;
            const messageDiv = document.getElementById('addUserMessage');
            
            if (!username || !password) {
                messageDiv.textContent = 'Por favor, preencha todos os campos.';
                messageDiv.className = 'error-message';
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('users')) || {};
            
            if (users[username]) {
                messageDiv.textContent = 'Usuário já existe.';
                messageDiv.className = 'error-message';
                return;
            }
            
            // Calcula a data de expiração se necessário
            let expirationDate = null;
            if (expirationDays > 0) {
                const expiration = new Date();
                expiration.setDate(expiration.getDate() + expirationDays);
                expirationDate = expiration.toISOString();
            }
            
            // Adiciona o novo usuário
            users[username] = {
                password: password,
                isAdmin: isAdmin,
                expirationDays: expirationDays,
                expirationDate: expirationDate
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            
            // Limpa os campos e mostra mensagem de sucesso
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('expirationDays').value = '30';
            document.getElementById('isAdmin').checked = false;
            
            messageDiv.textContent = 'Usuário adicionado com sucesso!';
            messageDiv.className = 'success-message';
            
            // Atualiza a lista de usuários
            loadUsers();
        }

        function changePassword() {
            const username = document.getElementById('changeUser').value;
            const newPassword = document.getElementById('newPasswordChange').value;
            const newExpirationDays = parseInt(document.getElementById('newExpirationDays').value);
            const messageDiv = document.getElementById('changePasswordMessage');
            
            if (!username || !newPassword) {
                messageDiv.textContent = 'Por favor, preencha todos os campos.';
                messageDiv.className = 'error-message';
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('users')) || {};
            
            if (!users[username]) {
                messageDiv.textContent = 'Usuário não encontrado.';
                messageDiv.className = 'error-message';
                return;
            }
            
            // Atualiza a senha
            users[username].password = newPassword;
            
            // Atualiza a data de expiração se necessário
            if (!isNaN(newExpirationDays) && newExpirationDays >= 0) {
                users[username].expirationDays = newExpirationDays;
                
                if (newExpirationDays > 0) {
                    const expiration = new Date();
                    expiration.setDate(expiration.getDate() + newExpirationDays);
                    users[username].expirationDate = expiration.toISOString();
                } else {
                    users[username].expirationDate = null;
                }
            }
            
            localStorage.setItem('users', JSON.stringify(users));
            
            // Limpa os campos e mostra mensagem de sucesso
            document.getElementById('newPasswordChange').value = '';
            document.getElementById('newExpirationDays').value = '';
            
            messageDiv.textContent = 'Senha alterada com sucesso!';
            messageDiv.className = 'success-message';
            
            // Atualiza a lista de usuários
            loadUsers();
        }

        function deleteUser(username) {
            if (!confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('users')) || {};
            
            if (users[username]) {
                delete users[username];
                localStorage.setItem('users', JSON.stringify(users));
                loadUsers();
                
                // Mostra mensagem de sucesso
                const messageDiv = document.getElementById('addUserMessage');
                messageDiv.textContent = 'Usuário excluído com sucesso!';
                messageDiv.className = 'success-message';
            }
        }

        function logout() {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.href = 'index.html';
        }
