package com.learningcurve.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controlador para roteamento de páginas web.
 * Redireciona rotas do frontend para o index.html para suportar SPA (Single Page Application).
 */
@Controller
public class WebController {

    // Encaminha requisições de rotas do frontend para o index.html
    @RequestMapping(value = {"/", "/editor/{id:[0-9]+}"})
    public String forwardToFrontendRoutes() {
        return "forward:/index.html";
    }
}